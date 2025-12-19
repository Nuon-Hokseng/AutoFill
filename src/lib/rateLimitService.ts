// Rate limiting service for free users
// Limits free users to 20 auto-generated data requests per day
// For logged-in users: tracks per user_id in database
// For logged-out users: tracks locally using device-local storage
//
// IMPORTANT: Ensure Supabase RLS policies on rate_limit_usage table allow:
// - SELECT: users can select their own records (WHERE auth.uid() = user_id)
// - UPDATE: users can update their own records (WHERE auth.uid() = user_id)
// - INSERT: users can insert their own records (WHERE auth.uid() = user_id)
// Without these policies, database updates will silently fail!

import { getUser } from "./authService"
import { supabaseAdmin } from "./supabaseAdmin"
import { supabase } from "./supabaseClient"

interface RateLimitData {
  generationCount: number
  lastResetDate: string // YYYY-MM-DD
  bonusUses?: number // Bonus uses granted for logging in at limit
  wasLimitedBeforeLogin?: boolean // Track if user was limited before logging in
}

const STORAGE_KEY = "rateLimitData"
const STORAGE_BACKUP_KEY = "rateLimitDataBackup"
const FREE_TIER_CREDITS = 20 // Remaining credits model (count down from 20)
const RESET_WINDOW_HOURS = 12 // Renew credits every 12 hours
const LOGIN_BONUS_USES = 3 // Bonus uses when logging in after hitting limit (only if you keep bonus logic)

type LocalRateV1 = {
  generationCount: number
  lastResetDate: string
  bonusUses?: number
}

type LocalRateV2 = {
  remaining: number
  lastResetAt: string // ISO timestamp
}

// Archive device-local rate limit so we can restore it after a user logs out
export async function archiveLocalRateLimit(): Promise<void> {
  return new Promise<void>((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const data = result[STORAGE_KEY]
      if (!data) {
        resolve()
        return
      }
      chrome.storage.local.set({ [STORAGE_BACKUP_KEY]: data }, () => resolve())
    })
  })
}

export async function restoreArchivedLocalRateLimit(): Promise<void> {
  return new Promise<void>((resolve) => {
    chrome.storage.local.get(STORAGE_BACKUP_KEY, (result) => {
      const data = result[STORAGE_BACKUP_KEY]
      if (!data) {
        resolve()
        return
      }
      chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
        chrome.storage.local.remove(STORAGE_BACKUP_KEY, () => resolve())
      })
    })
  })
}

function nowUtc(): Date {
  const n = new Date()
  return new Date(n.toISOString())
}

function addHours(d: Date, h: number): Date {
  const c = new Date(d)
  c.setUTCHours(c.getUTCHours() + h)
  return c
}

function isExpiredSince(
  lastIso: string | null | undefined,
  hours: number
): boolean {
  if (!lastIso) return true
  const last = new Date(lastIso)
  const n = nowUtc()
  return n.getTime() - last.getTime() >= hours * 60 * 60 * 1000
}

/**
 * Get current rate limit status for a user
 * For logged-in users: checks database
 * For logged-out users: checks local storage
 * Returns { remaining, isLimited, resetTime }
 */
export async function getRateLimitStatus(userId?: string): Promise<{
  remaining: number
  isLimited: boolean
  resetTime: string | null
  paymentStatus: "PAID" | "PENDING" | "EXPIRED" | "NOT_FOUND" | "ERROR"
}> {
  const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD

  // Try to get current user if userId not provided
  let currentUser = null
  let effectiveUserId = userId

  if (!effectiveUserId) {
    try {
      currentUser = await getUser()
      if (currentUser) {
        effectiveUserId = currentUser.id
      }
    } catch (error) {
      console.log("ℹ️ [getRateLimitStatus] No logged-in user")
      effectiveUserId = "device-local"
    }
  }

  const dbClient =
    supabaseAdmin &&
    effectiveUserId &&
    effectiveUserId !== "device-local" &&
    userId
      ? supabaseAdmin
      : supabase

  // If we have a real user ID and it's not device-local, check payment and database
  if (effectiveUserId && effectiveUserId !== "device-local") {
    console.log(`🔐 [getRateLimitStatus] User detected: ${effectiveUserId}`)

    // Fast-path: trust cached payment when available
    const cachedPayment = await getCachedPaymentStatus()
    if (cachedPayment === "PAID") {
      console.log(
        "💳 [getRateLimitStatus] Cached payment=PAID, skipping rate limit fetch"
      )
      return {
        remaining: Infinity,
        isLimited: false,
        resetTime: null,
        paymentStatus: "PAID"
      }
    }

    // Check payment status from DB
    console.log(`🔍 [getRateLimitStatus] Checking payment status...`)
    const paymentStatus = await checkPaymentStatus(effectiveUserId)
    console.log(
      `💳 [getRateLimitStatus] Payment status returned: ${paymentStatus}`
    )

    // If user is paid, no rate limiting
    if (paymentStatus === "PAID") {
      console.log(`💳 [getRateLimitStatus] User has PAID status`)
      return {
        remaining: Infinity,
        isLimited: false,
        resetTime: null,
        paymentStatus: "PAID"
      }
    }

    // For free users with account, check database (12h window, remaining credits model)
    try {
      // Get the latest record for the user
      const { data, error } = await dbClient
        .from("rate_limit_usage")
        .select("generation_count, updated_at")
        .eq("user_id", effectiveUserId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error && error.code !== "PGRST116") {
        console.warn(`⚠️ [getRateLimitStatus] DB error: ${error.message}`)
        return {
          remaining: FREE_TIER_CREDITS,
          isLimited: false,
          resetTime: addHours(nowUtc(), RESET_WINDOW_HOURS).toISOString(),
          paymentStatus
        }
      }

      // If no record, create with full credits
      if (!data) {
        await dbClient.from("rate_limit_usage").insert({
          user_id: effectiveUserId,
          generation_count: FREE_TIER_CREDITS,
          last_reset_date: today,
          updated_at: new Date().toISOString(),
          bonus_uses: 0
        })
        return {
          remaining: FREE_TIER_CREDITS,
          isLimited: false,
          resetTime: addHours(nowUtc(), RESET_WINDOW_HOURS).toISOString(),
          paymentStatus
        }
      }

      // Reset window if expired
      if (isExpiredSince(data.updated_at as any, RESET_WINDOW_HOURS)) {
        await dbClient
          .from("rate_limit_usage")
          .update({
            generation_count: FREE_TIER_CREDITS,
            last_reset_date: today,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", effectiveUserId)

        return {
          remaining: FREE_TIER_CREDITS,
          isLimited: false,
          resetTime: addHours(nowUtc(), RESET_WINDOW_HOURS).toISOString(),
          paymentStatus
        }
      }

      const remaining = Math.max(0, data.generation_count)
      const resetTime = addHours(
        new Date(data.updated_at as any),
        RESET_WINDOW_HOURS
      ).toISOString()
      return {
        remaining,
        isLimited: remaining <= 0,
        resetTime,
        paymentStatus
      }
    } catch (dbError) {
      console.error(`❌ [getRateLimitStatus] Database error caught: ${dbError}`)
      // IMPORTANT: For logged-in users, return fresh limit instead of falling back
      // This prevents the local storage from interfering
      return {
        remaining: FREE_TIER_CREDITS,
        isLimited: false,
        resetTime: null,
        paymentStatus: "NOT_FOUND"
      }
    }
  }

  // For non-logged-in users or fallback: use local storage
  console.log(`🔍 [getRateLimitStatus] Using local storage for date: ${today}`)

  const rateLimitData = await new Promise<any>((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      console.log(`🔍 [getRateLimitStatus] Storage result:`, result)
      let data: any = result[STORAGE_KEY]

      // Migrate V1 -> V2 if needed
      if (!data) {
        data = {
          remaining: FREE_TIER_CREDITS,
          lastResetAt: new Date().toISOString()
        } as LocalRateV2
        chrome.storage.local.set({ [STORAGE_KEY]: data }, () => resolve(data))
        return
      }

      if (data && typeof data.remaining !== "number") {
        // V1 shape: generationCount used up; convert to remaining
        const used = Math.max(0, (data as LocalRateV1).generationCount || 0)
        const remaining = Math.max(0, FREE_TIER_CREDITS - used)
        data = {
          remaining,
          lastResetAt: new Date().toISOString()
        } as LocalRateV2
        chrome.storage.local.set({ [STORAGE_KEY]: data }, () => resolve(data))
        return
      }

      // Reset if 12h window expired
      if (
        isExpiredSince((data as LocalRateV2).lastResetAt, RESET_WINDOW_HOURS)
      ) {
        data = {
          remaining: FREE_TIER_CREDITS,
          lastResetAt: new Date().toISOString()
        } as LocalRateV2
        chrome.storage.local.set({ [STORAGE_KEY]: data }, () => resolve(data))
        return
      }

      resolve(data)
    })
  })

  const remaining = Math.max(0, (rateLimitData as LocalRateV2).remaining)
  const resetTime = addHours(
    new Date((rateLimitData as LocalRateV2).lastResetAt),
    RESET_WINDOW_HOURS
  ).toISOString()

  return {
    remaining,
    isLimited: remaining <= 0,
    resetTime: resetTime,
    paymentStatus: "NOT_FOUND"
  }
}

/**
 * Increment the generation counter
 * For logged-in users: updates database
 * For logged-out users: updates local storage
 */
export async function incrementGenerationCount(userId?: string): Promise<void> {
  const today = new Date().toISOString().split("T")[0]
  console.log(`⬆️ [incrementGenerationCount] Called for date: ${today}`)

  // Prefer provided userId; only hit auth if missing
  let currentUser = null
  let effectiveUserId = userId

  if (!effectiveUserId) {
    try {
      currentUser = await getUser()
      if (currentUser) {
        effectiveUserId = currentUser.id
      }
    } catch (error) {
      console.log("ℹ️ [incrementGenerationCount] No logged-in user")
      effectiveUserId = "device-local"
    }
  }

  const dbClient =
    supabaseAdmin &&
    effectiveUserId &&
    effectiveUserId !== "device-local" &&
    userId
      ? supabaseAdmin
      : supabase

  // Pro users bypass counting entirely
  if (effectiveUserId && effectiveUserId !== "device-local") {
    console.log(
      `🔍 [incrementGenerationCount] Checking payment status for user: ${effectiveUserId}`
    )
    try {
      const cachedPayment = await getCachedPaymentStatus()
      if (cachedPayment === "PAID") {
        console.log(
          "✅ [incrementGenerationCount] PRO USER DETECTED - SKIP DECREMENT"
        )
        return
      }
      const payment = await checkPaymentStatus(effectiveUserId)
      console.log(
        `💳 [incrementGenerationCount] Payment status returned: ${payment}`
      )
      if (payment === "PAID") {
        console.log(
          "✅ [incrementGenerationCount] PRO USER DETECTED - SKIP DECREMENT"
        )
        return
      }
    } catch (e) {
      console.warn("⚠️ [incrementGenerationCount] Payment check failed:", e)
    }
  }

  // If we have a real user ID (not device-local), update database
  if (effectiveUserId && effectiveUserId !== "device-local") {
    try {
      console.log(
        `🔐 [incrementGenerationCount] User detected, updating DB for: ${effectiveUserId}`
      )

      // Get latest record
      const { data: existingData, error: selectError } = await dbClient
        .from("rate_limit_usage")
        .select("generation_count, updated_at")
        .eq("user_id", effectiveUserId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      console.log(
        `🔍 [incrementGenerationCount] Query result - Error: ${selectError ? selectError.message : "none"}, Data: ${existingData ? existingData.generation_count : "null"}`
      )

      if (!selectError && existingData) {
        // Reset window if expired
        let remaining = existingData.generation_count
        console.log(
          `📊 [incrementGenerationCount] Current remaining: ${remaining}`
        )
        if (
          isExpiredSince(existingData.updated_at as any, RESET_WINDOW_HOURS)
        ) {
          remaining = FREE_TIER_CREDITS
          console.log(
            `⏰ [incrementGenerationCount] Reset window expired, resetting to ${FREE_TIER_CREDITS}`
          )
        }
        // Decrement if available
        const newRemaining = Math.max(0, remaining - 1)
        console.log(
          `🔽 [incrementGenerationCount] Decrementing: ${remaining} -> ${newRemaining}`
        )

        const { data: updateData, error: updateError } = await dbClient
          .from("rate_limit_usage")
          .update({
            generation_count: newRemaining,
            updated_at: new Date().toISOString(),
            last_reset_date: today
          })
          .eq("user_id", effectiveUserId)
          .select()

        if (updateError) {
          console.error(
            "❌ [incrementGenerationCount] DB update error:",
            updateError.message,
            updateError
          )
          // Still return - don't fall back for logged-in users
          return
        } else {
          console.log(
            `✅ [incrementGenerationCount] DB updated successfully!`,
            updateData
          )
          console.log(
            `✅ [incrementGenerationCount] New remaining: ${newRemaining}`
          )
          return
        }
      } else if (selectError && selectError.code === "PGRST116") {
        // No record, create one with remaining-1
        const { error: insertError } = await dbClient
          .from("rate_limit_usage")
          .insert({
            user_id: effectiveUserId,
            generation_count: Math.max(0, FREE_TIER_CREDITS - 1),
            last_reset_date: today,
            bonus_uses: 0,
            updated_at: new Date().toISOString()
          })

        if (insertError) {
          console.error(
            "❌ [incrementGenerationCount] DB insert error:",
            insertError
          )
        } else {
          console.log(
            `✅ [incrementGenerationCount] DB created new record with count: 1`
          )
        }
        return
      } else if (selectError) {
        console.error(
          "❌ [incrementGenerationCount] DB select error:",
          selectError
        )
        return
      }
    } catch (dbError) {
      console.error("❌ [incrementGenerationCount] Database error:", dbError)
      // For logged-in users, DO NOT fall back - just return
      // The database is the source of truth for logged-in users
      return
    }
  }

  // Fallback to local storage (only for non-logged-in users)
  return new Promise<void>((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      let data: any = result[STORAGE_KEY]
      const defaultV2: LocalRateV2 = {
        remaining: FREE_TIER_CREDITS,
        lastResetAt: new Date().toISOString()
      }
      if (!data) data = defaultV2
      if (typeof data.remaining !== "number") {
        const used = Math.max(0, (data as LocalRateV1).generationCount || 0)
        data = {
          remaining: Math.max(0, FREE_TIER_CREDITS - used),
          lastResetAt: new Date().toISOString()
        } as LocalRateV2
      }
      if (
        isExpiredSince((data as LocalRateV2).lastResetAt, RESET_WINDOW_HOURS)
      ) {
        data = defaultV2
      }
      data.remaining = Math.max(0, (data as LocalRateV2).remaining - 1)
      data.lastResetAt = new Date().toISOString()
      // Use sync callback to ensure it's written before returning
      chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
        console.log(
          `✅ [incrementGenerationCount] Local saved remaining: ${(data as LocalRateV2).remaining}`
        )
        resolve()
      })
    })
  })
}

/**
 * Check if we can generate, and if so, increment the counter atomically
 * This prevents race conditions where multiple requests check before any increments
 * For logged-in users: uses database
 * For logged-out users: uses local storage
 */
export async function checkAndIncrementIfAllowed(userId?: string): Promise<{
  canGenerate: boolean
  message: string | null
  newCount: number
}> {
  const today = new Date().toISOString().split("T")[0]

  // Prefer the provided userId; only hit auth if missing
  let currentUser = null
  let effectiveUserId = userId

  if (!effectiveUserId) {
    try {
      currentUser = await getUser()
      if (currentUser) {
        effectiveUserId = currentUser.id
      }
    } catch (error) {
      console.log("ℹ️ [checkAndIncrementIfAllowed] No logged-in user")
      effectiveUserId = "device-local"
    }
  }

  // Choose client: if caller supplied userId and admin client exists, use admin to avoid auth requirement
  const dbClient =
    supabaseAdmin &&
    effectiveUserId &&
    effectiveUserId !== "device-local" &&
    userId
      ? supabaseAdmin
      : supabase

  // Pro users bypass rate limiting entirely
  if (effectiveUserId && effectiveUserId !== "device-local") {
    // Trust cached payment first to avoid hitting DB for pros
    const cachedPayment = await getCachedPaymentStatus()
    if (cachedPayment === "PAID") {
      console.log(
        `💳 [checkAndIncrementIfAllowed] Cached payment=PAID, bypassing limits`
      )
      return { canGenerate: true, message: null, newCount: Infinity as number }
    }

    console.log(
      `🔍 [checkAndIncrementIfAllowed] Checking payment status for user: ${effectiveUserId}`
    )
    try {
      const payment = await checkPaymentStatus(effectiveUserId)
      console.log(
        `💳 [checkAndIncrementIfAllowed] Payment status returned: ${payment}`
      )
      if (payment === "PAID") {
        console.log(
          `✅ [checkAndIncrementIfAllowed] PRO USER DETECTED - BYPASSING RATE LIMIT`
        )
        return {
          canGenerate: true,
          message: null,
          newCount: Infinity as number
        }
      }
      console.log(
        `⚠️ [checkAndIncrementIfAllowed] Payment status is NOT "PAID", continuing with normal flow`
      )
    } catch (e) {
      console.error(
        "❌ [checkAndIncrementIfAllowed] Payment check EXCEPTION:",
        e
      )
    }
  }

  // If we have a real user ID (not device-local), use database
  if (effectiveUserId && effectiveUserId !== "device-local") {
    try {
      console.log(
        `🔍 [checkAndIncrementIfAllowed] Checking DB for user: ${effectiveUserId}`
      )

      // Get latest record (12h window, remaining credits model)
      const { data: existingData, error: selectError } = await dbClient
        .from("rate_limit_usage")
        .select("generation_count, updated_at, id")
        .eq("user_id", effectiveUserId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      console.log(`📊 [checkAndIncrementIfAllowed] Fetched data:`, existingData)

      let remaining = FREE_TIER_CREDITS
      if (!selectError && existingData) {
        remaining = existingData.generation_count
        console.log(
          `📊 [checkAndIncrementIfAllowed] Current remaining: ${remaining}`
        )
        if (
          isExpiredSince(existingData.updated_at as any, RESET_WINDOW_HOURS)
        ) {
          remaining = FREE_TIER_CREDITS
          console.log(
            `⏰ [checkAndIncrementIfAllowed] Reset window expired, resetting to ${FREE_TIER_CREDITS}`
          )
        }
      } else if (selectError && selectError.code === "PGRST116") {
        // No record, create one
        await dbClient.from("rate_limit_usage").insert({
          user_id: effectiveUserId,
          generation_count: FREE_TIER_CREDITS,
          last_reset_date: today,
          updated_at: new Date().toISOString(),
          bonus_uses: 0
        })
        remaining = FREE_TIER_CREDITS
      } else if (selectError) {
        console.error(
          "❌ [checkAndIncrementIfAllowed] Select error:",
          selectError
        )
      }

      const canGenerate = remaining > 0
      if (canGenerate) {
        const newRemaining = Math.max(0, remaining - 1)
        console.log(
          `🔽 [checkAndIncrementIfAllowed] Decrementing: ${remaining} -> ${newRemaining}`
        )
        console.log(
          `🎯 [checkAndIncrementIfAllowed] Updating record with id: ${existingData?.id}, user_id: ${effectiveUserId}`
        )

        const {
          data: updateData,
          error: updateError,
          count
        } = await dbClient
          .from("rate_limit_usage")
          .update({
            generation_count: newRemaining,
            updated_at: new Date().toISOString(),
            last_reset_date: today
          })
          .eq("user_id", effectiveUserId)
          .select()

        console.log(`📝 [checkAndIncrementIfAllowed] Update response:`, {
          updateData,
          updateError,
          count
        })

        if (updateError) {
          console.error(
            "❌ [checkAndIncrementIfAllowed] Update error:",
            updateError.message,
            updateError
          )
          return {
            canGenerate: false,
            message: "Failed to update rate limit",
            newCount: remaining
          }
        }

        if (!updateData || updateData.length === 0) {
          console.warn(
            "⚠️ [checkAndIncrementIfAllowed] Update returned no rows (likely RLS). Allowing generation to proceed."
          )
          return {
            canGenerate: true,
            message: null,
            newCount: newRemaining
          }
        }

        console.log(
          `✅ [checkAndIncrementIfAllowed] DB updated successfully!`,
          updateData
        )
        console.log(
          `✅ [checkAndIncrementIfAllowed] New remaining: ${newRemaining}`
        )
        return {
          canGenerate: true,
          message: null,
          newCount: newRemaining
        }
      } else {
        console.log(
          `⛔ [checkAndIncrementIfAllowed] User limited at DB remaining: ${remaining}`
        )
        return {
          canGenerate: false,
          message: `⛔ You've reached your limit. Credits renew in 12 hours.`,
          newCount: remaining
        }
      }
    } catch (dbError) {
      console.error("❌ [checkAndIncrementIfAllowed] Database error:", dbError)
      console.log("⚠️ Falling back to local storage")
    }
  }

  // Fallback to local storage
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, async (result) => {
      let data: any = result[STORAGE_KEY]
      const defaultV2: LocalRateV2 = {
        remaining: FREE_TIER_CREDITS,
        lastResetAt: new Date().toISOString()
      }
      if (!data) data = defaultV2
      if (typeof data.remaining !== "number") {
        const used = Math.max(0, (data as LocalRateV1).generationCount || 0)
        data = {
          remaining: Math.max(0, FREE_TIER_CREDITS - used),
          lastResetAt: new Date().toISOString()
        } as LocalRateV2
      }
      // Reset if expired
      if (
        isExpiredSince((data as LocalRateV2).lastResetAt, RESET_WINDOW_HOURS)
      ) {
        data = defaultV2
      }

      const canGenerate = (data as LocalRateV2).remaining > 0
      if (canGenerate) {
        ;(data as LocalRateV2).remaining = Math.max(
          0,
          (data as LocalRateV2).remaining - 1
        )
        ;(data as LocalRateV2).lastResetAt = new Date().toISOString()
        chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
          console.log(
            `✅ [checkAndIncrementIfAllowed] Local decremented, remaining ${(data as LocalRateV2).remaining}`
          )
          resolve({
            canGenerate: true,
            message: null,
            newCount: (data as LocalRateV2).remaining
          })
        })
      } else {
        resolve({
          canGenerate: false,
          message: `⛔ You've reached your limit. Credits renew in 12 hours.`,
          newCount: (data as LocalRateV2).remaining
        })
      }
    })
  })
}

/**
 * Check payment status for a user
 * Returns: "PAID" | "PENDING" | "EXPIRED" | "NOT_FOUND" | "ERROR"
 */
export async function checkPaymentStatus(
  userId?: string
): Promise<"PAID" | "PENDING" | "EXPIRED" | "NOT_FOUND" | "ERROR"> {
  try {
    // Get user ID if not provided
    let effectiveUserId = userId
    if (!effectiveUserId) {
      try {
        const currentUser = await getUser()
        if (!currentUser) {
          console.warn("⚠️ No user logged in")
          return "NOT_FOUND"
        }
        effectiveUserId = currentUser.id
      } catch (error) {
        console.warn("⚠️ Error getting current user")
        return "NOT_FOUND"
      }
    }

    if (!effectiveUserId) {
      console.warn("⚠️ No user ID provided for payment check")
      return "NOT_FOUND"
    }

    console.log(
      `💳 [checkPaymentStatus] Querying payments for user: ${effectiveUserId}`
    )

    // Use admin client if available to bypass RLS, otherwise use regular client
    const client = supabaseAdmin || supabase
    console.log(
      `💳 [checkPaymentStatus] Using ${supabaseAdmin ? "ADMIN" : "regular"} client`
    )

    const { data, error } = await client
      .from("payments")
      .select("payway_status, expires_at, created_at")
      .eq("user_id", effectiveUserId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    console.log(
      `💳 [checkPaymentStatus] Query result - Error: ${error ? error.message : "none"}, Data:`,
      data
    )

    if (error) {
      if (error.code === "PGRST116") {
        // No rows found
        console.log("💳 No payment record found for user")
        return "NOT_FOUND"
      }
      console.error("❌ Error checking payment status:", error.message)
      return "ERROR"
    }

    if (!data) {
      return "NOT_FOUND"
    }

    const { payway_status, expires_at } = data

    // Check if payment has expired
    if (expires_at) {
      const expiryDate = new Date(expires_at)
      const now = new Date()
      if (now > expiryDate) {
        console.log("⏰ Payment expired")
        return "EXPIRED"
      }
    }

    // Check payment status
    if (payway_status === "PAID") {
      console.log("✅ Payment status: PAID")
      return "PAID"
    } else if (payway_status === "PENDING") {
      console.log("⏳ Payment status: PENDING")
      return "PENDING"
    } else {
      console.log("❓ Unknown payment status:", payway_status)
      return "EXPIRED"
    }
  } catch (error) {
    console.error("❌ Error in checkPaymentStatus:", error)
    return "ERROR"
  }
}

/**
 * Check and sync payment status for currently logged in user
 * This runs automatically when user logs in
 */
export async function syncPaymentStatusOnLogin(userId?: string): Promise<void> {
  try {
    let effectiveUserId = userId
    if (!effectiveUserId) {
      try {
        const currentUser = await getUser()
        if (currentUser) {
          effectiveUserId = currentUser.id
        }
      } catch (error) {
        console.error("❌ Error getting current user for sync:", error)
        return
      }
    }

    if (!effectiveUserId) {
      console.warn("⚠️ No user ID for payment sync")
      return
    }

    console.log("🔄 Syncing payment status for user:", effectiveUserId)
    const status = await checkPaymentStatus(effectiveUserId)

    // Store status in local storage for quick access
    return new Promise<void>((resolve) => {
      chrome.storage.local.set(
        {
          lastPaymentStatus: status,
          lastPaymentCheckTime: new Date().toISOString()
        },
        () => {
          console.log(`💾 Payment status cached: ${status}`)
          resolve()
        }
      )
    })
  } catch (error) {
    console.error("❌ Error syncing payment status:", error)
  }
}

/**
 * Get cached payment status (without hitting database again)
 */
export async function getCachedPaymentStatus(): Promise<
  "PAID" | "PENDING" | "EXPIRED" | "NOT_FOUND" | "ERROR" | null
> {
  return new Promise<
    "PAID" | "PENDING" | "EXPIRED" | "NOT_FOUND" | "ERROR" | null
  >((resolve) => {
    try {
      chrome.storage.local.get(
        ["lastPaymentStatus", "lastPaymentCheckTime"],
        (data) => {
          resolve(data.lastPaymentStatus || null)
        }
      )
    } catch (error) {
      console.error("❌ Error getting cached payment status:", error)
      resolve(null)
    }
  })
}

/**
 * Get detailed payment information including expiration date
 */
export async function getPaymentDetails(userId?: string): Promise<{
  status: "PAID" | "PENDING" | "EXPIRED" | "NOT_FOUND" | "ERROR"
  expiresAt: string | null
  daysRemaining: number | null
}> {
  try {
    let effectiveUserId = userId
    if (!effectiveUserId) {
      try {
        const currentUser = await getUser()
        if (!currentUser) {
          return { status: "NOT_FOUND", expiresAt: null, daysRemaining: null }
        }
        effectiveUserId = currentUser.id
      } catch (error) {
        return { status: "NOT_FOUND", expiresAt: null, daysRemaining: null }
      }
    }

    if (!effectiveUserId) {
      return { status: "NOT_FOUND", expiresAt: null, daysRemaining: null }
    }

    const client = supabaseAdmin || supabase
    const { data, error } = await client
      .from("payments")
      .select("payway_status, expires_at, created_at")
      .eq("user_id", effectiveUserId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      // Cache NOT_FOUND to avoid repeated DB hits
      try {
        await new Promise<void>((resolve) =>
          chrome.storage.local.set(
            {
              lastPaymentStatus: "NOT_FOUND",
              lastPaymentCheckTime: new Date().toISOString()
            },
            () => resolve()
          )
        )
      } catch {}
      return { status: "NOT_FOUND", expiresAt: null, daysRemaining: null }
    }

    const { payway_status, expires_at } = data
    let daysRemaining: number | null = null

    if (expires_at) {
      const expiryDate = new Date(expires_at)
      const now = new Date()
      const diffMs = expiryDate.getTime() - now.getTime()
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

      if (now > expiryDate) {
        // Cache EXPIRED
        try {
          await new Promise<void>((resolve) =>
            chrome.storage.local.set(
              {
                lastPaymentStatus: "EXPIRED",
                lastPaymentCheckTime: new Date().toISOString()
              },
              () => resolve()
            )
          )
        } catch {}
        return { status: "EXPIRED", expiresAt: expires_at, daysRemaining: 0 }
      }
    }

    let status: "PAID" | "PENDING" | "EXPIRED" = "EXPIRED"
    if (payway_status === "PAID") {
      status = "PAID"
    } else if (payway_status === "PENDING") {
      status = "PENDING"
    } else {
      status = "EXPIRED"
    }

    // Cache status for faster checks in background flows
    try {
      await new Promise<void>((resolve) =>
        chrome.storage.local.set(
          {
            lastPaymentStatus: status,
            lastPaymentCheckTime: new Date().toISOString()
          },
          () => resolve()
        )
      )
    } catch {}

    return { status, expiresAt: expires_at, daysRemaining }
  } catch (error) {
    console.error("❌ Error getting payment details:", error)
    return { status: "ERROR", expiresAt: null, daysRemaining: null }
  }
}

/**
 * Reset rate limit (for testing or admin purposes)
 */
export async function resetRateLimit(): Promise<void> {
  return new Promise<void>((resolve) => {
    const today = new Date().toISOString().split("T")[0]
    chrome.storage.local.set(
      {
        [STORAGE_KEY]: {
          generationCount: 0,
          lastResetDate: today
        }
      },
      () => {
        console.log("🔄 Rate limit reset")
        resolve()
      }
    )
  })
}

/**
 * Get rate limit stats (for dashboard display)
 * For logged-in users: fetches from database
 * For logged-out users: fetches from local storage
 */
export async function getRateLimitStats(): Promise<{
  generationCount: number
  dailyLimit: number
  percentageUsed: number
  lastReset: string
}> {
  const today = new Date().toISOString().split("T")[0]

  // Try to get current user
  let currentUser = null
  try {
    currentUser = await getUser()
  } catch (error) {
    console.log("ℹ️ [getRateLimitStats] No logged-in user")
  }

  // If user is logged in, check cached payment first (fast path)
  if (currentUser?.id) {
    try {
      const cached = await getCachedPaymentStatus()
      if (cached === "PAID") {
        return {
          generationCount: 0,
          dailyLimit: Infinity,
          percentageUsed: 0,
          lastReset: today
        }
      }
    } catch {}

    // Otherwise, check live payment status
    console.log(
      `🔍 [getRateLimitStats] Checking payment for user: ${currentUser.id}`
    )
    try {
      const paymentStatus = await checkPaymentStatus(currentUser.id)
      console.log(`💳 [getRateLimitStats] Payment status: ${paymentStatus}`)

      // Pro users have unlimited stats
      if (paymentStatus === "PAID") {
        console.log(
          `✅ [getRateLimitStats] PRO USER - returning unlimited stats`
        )
        return {
          generationCount: 0,
          dailyLimit: Infinity,
          percentageUsed: 0,
          lastReset: today
        }
      }
    } catch (paymentError) {
      console.warn("⚠️ [getRateLimitStats] Payment check failed:", paymentError)
    }

    // If not paid, fetch rate limit from database
    try {
      const { data, error } = await supabase
        .from("rate_limit_usage")
        .select("generation_count, updated_at, bonus_uses")
        .eq("user_id", currentUser.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!error && data) {
        // Check if reset window expired
        let remaining = data.generation_count
        if (isExpiredSince(data.updated_at as any, RESET_WINDOW_HOURS)) {
          remaining = FREE_TIER_CREDITS
        }

        const used = Math.max(0, FREE_TIER_CREDITS - remaining)
        const bonusUses = data.bonus_uses || 0
        const dailyLimit = FREE_TIER_CREDITS + bonusUses

        return {
          generationCount: used,
          dailyLimit: dailyLimit,
          percentageUsed: Math.round((used / dailyLimit) * 100),
          lastReset: (data.updated_at as string) || today
        }
      }
    } catch (dbError) {
      console.error("❌ [getRateLimitStats] Database error:", dbError)
    }
  }

  // Fallback to local storage (for non-logged-in users)
  return new Promise<{
    generationCount: number
    dailyLimit: number
    percentageUsed: number
    lastReset: string
  }>((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const data: any = result[STORAGE_KEY] || {
        remaining: FREE_TIER_CREDITS,
        lastResetAt: new Date().toISOString()
      }
      const remaining =
        typeof data.remaining === "number"
          ? data.remaining
          : Math.max(0, FREE_TIER_CREDITS - (data.generationCount || 0))

      resolve({
        generationCount: Math.max(0, FREE_TIER_CREDITS - remaining),
        dailyLimit: FREE_TIER_CREDITS + (data.bonusUses || 0),
        percentageUsed: Math.round(
          (Math.max(0, FREE_TIER_CREDITS - remaining) /
            (FREE_TIER_CREDITS + (data.bonusUses || 0))) *
            100
        ),
        lastReset: (data.lastResetAt as string) || today
      })
    })
  })
}
/**
 * Clear local storage rate limit data (for account switching)
 * Called when user logs in to prevent cross-account limit bleed
 */
export async function clearLocalRateLimit(): Promise<void> {
  return new Promise<void>((resolve) => {
    chrome.storage.local.remove(STORAGE_KEY, () => {
      console.log(`🗑️ [clearLocalRateLimit] Local rate limit data cleared`)
      resolve()
    })
  })
}

/**
 * Sync rate limit from database to ensure consistency across devices
 * This should be called when user logs in to ensure their rate limit is up-to-date
 * @param userId - The user ID to sync rate limit for
 */
export async function syncRateLimitFromDatabase(userId: string): Promise<void> {
  try {
    console.log(`🔄 [syncRateLimitFromDatabase] Syncing for user: ${userId}`)
    const cachedPayment = await getCachedPaymentStatus()
    if (cachedPayment === "PAID") {
      console.log(
        "💳 [syncRateLimitFromDatabase] Cached payment=PAID, skipping sync"
      )
      return
    }

    const livePayment = await checkPaymentStatus(userId)
    if (livePayment === "PAID") {
      console.log(
        "💳 [syncRateLimitFromDatabase] Live payment=PAID, skipping sync"
      )
      return
    }
    const today = new Date().toISOString().split("T")[0]

    // Get the latest record for the user from database
    const { data, error } = await supabase
      .from("rate_limit_usage")
      .select("generation_count, updated_at, bonus_uses, last_reset_date")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      console.warn(`⚠️ [syncRateLimitFromDatabase] DB error: ${error.message}`)
      return
    }

    // If no record exists, create one with full credits
    if (!data) {
      console.log(
        `📝 [syncRateLimitFromDatabase] No record found, creating new one`
      )
      await supabase.from("rate_limit_usage").insert({
        user_id: userId,
        generation_count: FREE_TIER_CREDITS,
        last_reset_date: today,
        updated_at: new Date().toISOString(),
        bonus_uses: 0
      })
      console.log(
        `✅ [syncRateLimitFromDatabase] Created new record with ${FREE_TIER_CREDITS} credits`
      )
      return
    }

    // Check if the reset window has expired (12 hours since last update)
    if (isExpiredSince(data.updated_at as any, RESET_WINDOW_HOURS)) {
      console.log(
        `⏰ [syncRateLimitFromDatabase] Reset window expired, refreshing credits`
      )
      await supabase
        .from("rate_limit_usage")
        .update({
          generation_count: FREE_TIER_CREDITS,
          last_reset_date: today,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", userId)

      console.log(
        `✅ [syncRateLimitFromDatabase] Credits refreshed to ${FREE_TIER_CREDITS}`
      )
    } else {
      console.log(
        `✅ [syncRateLimitFromDatabase] Rate limit synced: ${data.generation_count} credits remaining`
      )
    }
  } catch (error) {
    console.error(
      `❌ [syncRateLimitFromDatabase] Sync failed: ${error.message || error}`
    )
  }
}

/**
 * Grant login bonus uses (3 uses) when user logs in after hitting the limit
 * For logged-in users: updates database
 * For logged-out users: updates local storage
 */
export async function grantLoginBonus(userId?: string): Promise<void> {
  const today = new Date().toISOString().split("T")[0]
  console.log(`🎁 [grantLoginBonus] Checking for login bonus eligibility`)

  // Try to get current user if userId not provided
  let currentUser = null
  let effectiveUserId = userId

  if (!effectiveUserId) {
    try {
      currentUser = await getUser()
      if (currentUser) {
        effectiveUserId = currentUser.id
      }
    } catch (error) {
      console.log("ℹ️ [grantLoginBonus] No logged-in user")
      effectiveUserId = "device-local"
    }
  }

  // If we have a real user ID (not device-local), update database
  if (effectiveUserId && effectiveUserId !== "device-local") {
    try {
      const { data: existingData, error: selectError } = await supabase
        .from("rate_limit_usage")
        .select("generation_count, bonus_uses")
        .eq("user_id", effectiveUserId)
        .eq("last_reset_date", today)
        .single()

      if (!selectError && existingData) {
        // Check if user was limited before logging in
        if (
          existingData.generation_count <= 0 &&
          (!existingData.bonus_uses || existingData.bonus_uses === 0)
        ) {
          console.log(
            `🎁 [grantLoginBonus] User was limited, granting ${LOGIN_BONUS_USES} bonus uses in DB!`
          )

          const { error: updateError } = await supabase
            .from("rate_limit_usage")
            .update({ bonus_uses: LOGIN_BONUS_USES })
            .eq("user_id", effectiveUserId)
            .eq("last_reset_date", today)

          if (updateError) {
            console.error("❌ [grantLoginBonus] DB update error:", updateError)
          } else {
            console.log(`✅ [grantLoginBonus] Bonus uses granted in DB`)
            return
          }
        } else {
          console.log(`ℹ️ [grantLoginBonus] User not eligible for DB bonus`)
          return
        }
      }
    } catch (dbError) {
      console.error("❌ [grantLoginBonus] Database error:", dbError)
      console.log("⚠️ [grantLoginBonus] Falling back to local storage")
    }
  }

  // Fallback to local storage
  return new Promise<void>((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const data: RateLimitData = result[STORAGE_KEY] || {
        generationCount: 0,
        lastResetDate: today
      }

      // Check if user was limited before logging in (3 uses already made today)
      if (
        data.lastResetDate === today &&
        data.generationCount >= FREE_TIER_CREDITS &&
        !data.bonusUses
      ) {
        console.log(
          `🎁 [grantLoginBonus] User was limited, granting ${LOGIN_BONUS_USES} bonus uses!`
        )
        data.bonusUses = LOGIN_BONUS_USES

        chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
          console.log(`✅ [grantLoginBonus] Bonus uses granted and saved`)
          resolve()
        })
      } else {
        console.log(`ℹ️ [grantLoginBonus] User not eligible for bonus`)
        resolve()
      }
    })
  })
}
