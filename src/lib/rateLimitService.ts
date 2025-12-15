// Rate limiting service for free users
// Limits free users to 3 auto-generated data requests per day
// For logged-in users: tracks per user_id in database
// For logged-out users: tracks locally using device-local storage

import { getUser } from "./authService"
import { supabase } from "./supabaseClient"

interface RateLimitData {
  generationCount: number
  lastResetDate: string // YYYY-MM-DD
  bonusUses?: number // Bonus uses granted for logging in at limit
  wasLimitedBeforeLogin?: boolean // Track if user was limited before logging in
}

const STORAGE_KEY = "rateLimitData"
const FREE_TIER_DAILY_LIMIT = 3
const LOGIN_BONUS_USES = 3 // Bonus uses when logging in after hitting limit

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

  // If we have a real user ID and it's not device-local, check payment and database
  if (effectiveUserId && effectiveUserId !== "device-local") {
    console.log(`🔐 [getRateLimitStatus] User detected: ${effectiveUserId}`)

    // Check payment status first
    const paymentStatus = await checkPaymentStatus(effectiveUserId)

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

    // For free users with account, check database
    try {
      console.log(
        `🔍 [getRateLimitStatus] Querying DB for user: ${effectiveUserId}, date: ${today}`
      )

      const { data, error } = await supabase
        .from("rate_limit_usage")
        .select("generation_count, last_reset_date, bonus_uses")
        .eq("user_id", effectiveUserId)
        .eq("last_reset_date", today)
        .single()

      console.log(
        `🔍 [getRateLimitStatus] DB Query result - Error: ${error ? error.message : "none"}, Data: ${data ? JSON.stringify(data) : "null"}`
      )

      if (!error && data) {
        // Found today's record
        const totalDailyLimit = FREE_TIER_DAILY_LIMIT + (data.bonus_uses || 0)
        const remaining = Math.max(0, totalDailyLimit - data.generation_count)
        const isLimited = remaining <= 0

        console.log(
          `✅ [getRateLimitStatus] DB Count: ${data.generation_count}/${totalDailyLimit}, Remaining: ${remaining}, Limited: ${isLimited}`
        )

        const resetDate = new Date(today)
        resetDate.setUTCDate(resetDate.getUTCDate() + 1)
        resetDate.setUTCHours(0, 0, 0, 0)
        const resetTime = resetDate.toISOString()

        return {
          remaining,
          isLimited,
          resetTime: isLimited ? resetTime : null,
          paymentStatus
        }
      } else if (error && error.code !== "PGRST116") {
        // PGRST116 means no rows found (first time today), which is fine
        console.warn(
          `⚠️ [getRateLimitStatus] Database error (non-PGRST116): ${error.message}`
        )
        // IMPORTANT: Do not fall back to local storage on error for logged-in users
        // Return a default to prevent local storage bypass
        return {
          remaining: FREE_TIER_DAILY_LIMIT,
          isLimited: false,
          resetTime: null,
          paymentStatus
        }
      }

      // No record for today (PGRST116), create one
      console.log(
        `📝 [getRateLimitStatus] No record found, creating new one for today`
      )

      const { error: insertError } = await supabase
        .from("rate_limit_usage")
        .insert({
          user_id: effectiveUserId,
          generation_count: 0,
          last_reset_date: today,
          bonus_uses: 0
        })

      if (insertError) {
        console.warn(
          `⚠️ [getRateLimitStatus] Failed to create rate limit record: ${insertError.message}`
        )
      } else {
        console.log(
          `✅ [getRateLimitStatus] New record created for user: ${effectiveUserId}`
        )
      }

      return {
        remaining: FREE_TIER_DAILY_LIMIT,
        isLimited: false,
        resetTime: null,
        paymentStatus
      }
    } catch (dbError) {
      console.error(`❌ [getRateLimitStatus] Database error caught: ${dbError}`)
      // IMPORTANT: For logged-in users, return fresh limit instead of falling back
      // This prevents the local storage from interfering
      return {
        remaining: FREE_TIER_DAILY_LIMIT,
        isLimited: false,
        resetTime: null,
        paymentStatus: "NOT_FOUND"
      }
    }
  }

  // For non-logged-in users or fallback: use local storage
  console.log(`🔍 [getRateLimitStatus] Using local storage for date: ${today}`)

  const rateLimitData = await new Promise<RateLimitData>((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      console.log(`🔍 [getRateLimitStatus] Storage result:`, result)
      let data: RateLimitData = result[STORAGE_KEY] || {
        generationCount: 0,
        lastResetDate: today
      }

      console.log(`🔍 [getRateLimitStatus] Current data:`, data)

      // Reset counter if it's a new day
      if (data.lastResetDate !== today) {
        console.log(
          `🔄 [getRateLimitStatus] New day detected, resetting counter`
        )
        data = {
          generationCount: 0,
          lastResetDate: today
        }
        // IMPORTANT: Wait for storage to complete before resolving
        chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
          console.log(`💾 [getRateLimitStatus] Reset data saved to storage`)
          resolve(data)
        })
      } else {
        resolve(data)
      }
    })
  })

  const totalDailyLimit = FREE_TIER_DAILY_LIMIT + (rateLimitData.bonusUses || 0)
  const remaining = Math.max(0, totalDailyLimit - rateLimitData.generationCount)
  const isLimited = remaining <= 0

  console.log(
    `📊 [getRateLimitStatus] Local Count: ${rateLimitData.generationCount}/${totalDailyLimit} (base: ${FREE_TIER_DAILY_LIMIT}, bonus: ${rateLimitData.bonusUses || 0}), Remaining: ${remaining}, Limited: ${isLimited}`
  )

  // Calculate reset time (midnight UTC next day)
  const resetDate = new Date(today)
  resetDate.setUTCDate(resetDate.getUTCDate() + 1)
  resetDate.setUTCHours(0, 0, 0, 0)
  const resetTime = resetDate.toISOString()

  return {
    remaining,
    isLimited,
    resetTime: isLimited ? resetTime : null,
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
      console.log("ℹ️ [incrementGenerationCount] No logged-in user")
      effectiveUserId = "device-local"
    }
  }

  // If we have a real user ID (not device-local), update database
  if (effectiveUserId && effectiveUserId !== "device-local") {
    try {
      console.log(
        `🔐 [incrementGenerationCount] User detected, updating DB for: ${effectiveUserId}`
      )

      // First try to update existing record
      const { data: existingData, error: selectError } = await supabase
        .from("rate_limit_usage")
        .select("generation_count")
        .eq("user_id", effectiveUserId)
        .eq("last_reset_date", today)
        .single()

      console.log(
        `🔍 [incrementGenerationCount] Query result - Error: ${selectError ? selectError.message : "none"}, Data: ${existingData ? existingData.generation_count : "null"}`
      )

      if (!selectError && existingData) {
        // Record exists, increment it
        const { error: updateError } = await supabase
          .from("rate_limit_usage")
          .update({
            generation_count: existingData.generation_count + 1
          })
          .eq("user_id", effectiveUserId)
          .eq("last_reset_date", today)

        if (updateError) {
          console.error(
            "❌ [incrementGenerationCount] DB update error:",
            updateError
          )
          // Still return - don't fall back for logged-in users
          return
        } else {
          console.log(
            `✅ [incrementGenerationCount] DB updated to: ${existingData.generation_count + 1}`
          )
          return
        }
      } else if (selectError && selectError.code === "PGRST116") {
        // No record for today, create one
        const { error: insertError } = await supabase
          .from("rate_limit_usage")
          .insert({
            user_id: effectiveUserId,
            generation_count: 1,
            last_reset_date: today,
            bonus_uses: 0
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
      console.log(`⬆️ [incrementGenerationCount] Current storage:`, result)
      let data: RateLimitData = result[STORAGE_KEY] || {
        generationCount: 0,
        lastResetDate: today
      }

      console.log(`⬆️ [incrementGenerationCount] Before increment:`, data)

      // Reset counter if it's a new day
      if (data.lastResetDate !== today) {
        console.log(`⬆️ [incrementGenerationCount] New day, setting to 1`)
        data = {
          generationCount: 1,
          lastResetDate: today
        }
      } else {
        const oldCount = data.generationCount
        data.generationCount = Math.min(
          data.generationCount + 1,
          FREE_TIER_DAILY_LIMIT + 1
        )
        console.log(
          `⬆️ [incrementGenerationCount] Incremented from ${oldCount} to ${data.generationCount}`
        )
      }

      console.log(`⬆️ [incrementGenerationCount] Saving to storage:`, data)
      // Use sync callback to ensure it's written before returning
      chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
        console.log(
          `✅ [incrementGenerationCount] Saved! Count: ${data.generationCount}/${FREE_TIER_DAILY_LIMIT}`
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
      console.log("ℹ️ [checkAndIncrementIfAllowed] No logged-in user")
      effectiveUserId = "device-local"
    }
  }

  // If we have a real user ID (not device-local), use database
  if (effectiveUserId && effectiveUserId !== "device-local") {
    try {
      console.log(
        `🔍 [checkAndIncrementIfAllowed] Checking DB for user: ${effectiveUserId}`
      )

      // Get or create record for today
      const { data: existingData, error: selectError } = await supabase
        .from("rate_limit_usage")
        .select("generation_count, bonus_uses")
        .eq("user_id", effectiveUserId)
        .eq("last_reset_date", today)
        .single()

      let currentCount = 0
      let bonusUses = 0

      if (!selectError && existingData) {
        currentCount = existingData.generation_count
        bonusUses = existingData.bonus_uses || 0
      } else if (selectError && selectError.code === "PGRST116") {
        // No record for today, will create one
        const { error: insertError } = await supabase
          .from("rate_limit_usage")
          .insert({
            user_id: effectiveUserId,
            generation_count: 0,
            last_reset_date: today,
            bonus_uses: 0
          })

        if (insertError) {
          console.error(
            "❌ [checkAndIncrementIfAllowed] Insert error:",
            insertError
          )
        }
      } else if (selectError) {
        console.error(
          "❌ [checkAndIncrementIfAllowed] Select error:",
          selectError
        )
      }

      const remaining = Math.max(
        0,
        FREE_TIER_DAILY_LIMIT + bonusUses - currentCount
      )
      const canGenerate = remaining > 0

      if (canGenerate) {
        // Increment in database
        const { error: updateError } = await supabase
          .from("rate_limit_usage")
          .update({ generation_count: currentCount + 1 })
          .eq("user_id", effectiveUserId)
          .eq("last_reset_date", today)

        if (updateError) {
          console.error(
            "❌ [checkAndIncrementIfAllowed] Update error:",
            updateError
          )
        } else {
          console.log(
            `✅ [checkAndIncrementIfAllowed] DB incremented to ${currentCount + 1}`
          )
          return {
            canGenerate: true,
            message: null,
            newCount: currentCount + 1
          }
        }
      } else {
        console.log(
          `⛔ [checkAndIncrementIfAllowed] User limited at DB count: ${currentCount}`
        )
        const resetDate = new Date(today)
        resetDate.setUTCDate(resetDate.getUTCDate() + 1)

        return {
          canGenerate: false,
          message: `⛔ You've reached your daily limit of ${FREE_TIER_DAILY_LIMIT + bonusUses} auto-generates.`,
          newCount: currentCount
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
      let data: RateLimitData = result[STORAGE_KEY] || {
        generationCount: 0,
        lastResetDate: today
      }

      // Reset counter if it's a new day
      if (data.lastResetDate !== today) {
        data = {
          generationCount: 0,
          lastResetDate: today
        }
      }

      const remaining = Math.max(
        0,
        FREE_TIER_DAILY_LIMIT - data.generationCount
      )
      const canGenerate = remaining > 0

      if (canGenerate) {
        // Increment immediately
        data.generationCount += 1
        console.log(
          `⬆️ [checkAndIncrementIfAllowed] Local incremented to ${data.generationCount}`
        )

        chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
          console.log(
            `✅ [checkAndIncrementIfAllowed] Local saved count: ${data.generationCount}`
          )
          resolve({
            canGenerate: true,
            message: null,
            newCount: data.generationCount
          })
        })
      } else {
        // Don't increment, just report limited
        const resetDate = new Date(today)
        resetDate.setUTCDate(resetDate.getUTCDate() + 1)

        resolve({
          canGenerate: false,
          message: `⛔ You've reached your daily limit of 3 auto-generates.`,
          newCount: data.generationCount
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

    const { data, error } = await supabase
      .from("payments")
      .select("payway_status, expires_at, created_at")
      .eq("user_id", effectiveUserId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

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
 */
export async function getRateLimitStats(): Promise<{
  generationCount: number
  dailyLimit: number
  percentageUsed: number
  lastReset: string
}> {
  return new Promise<{
    generationCount: number
    dailyLimit: number
    percentageUsed: number
    lastReset: string
  }>((resolve) => {
    const today = new Date().toISOString().split("T")[0]
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const data: RateLimitData = result[STORAGE_KEY] || {
        generationCount: 0,
        lastResetDate: today
      }

      resolve({
        generationCount: data.generationCount,
        dailyLimit: FREE_TIER_DAILY_LIMIT + (data.bonusUses || 0),
        percentageUsed: Math.round(
          (data.generationCount /
            (FREE_TIER_DAILY_LIMIT + (data.bonusUses || 0))) *
            100
        ),
        lastReset: data.lastResetDate
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
          existingData.generation_count >= FREE_TIER_DAILY_LIMIT &&
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
        data.generationCount >= FREE_TIER_DAILY_LIMIT &&
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
