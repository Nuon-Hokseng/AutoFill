// Rate limiting service for free users
// Limits free users to 3 auto-generated data requests per day

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
 * Returns { remaining, isLimited, resetTime }
 */
export async function getRateLimitStatus(userId: string): Promise<{
  remaining: number
  isLimited: boolean
  resetTime: string | null
  paymentStatus: "PAID" | "PENDING" | "EXPIRED" | "NOT_FOUND" | "ERROR"
}> {
  // Check payment status first
  const paymentStatus = await checkPaymentStatus(userId)

  // If user is paid, no rate limiting
  if (paymentStatus === "PAID") {
    return {
      remaining: Infinity,
      isLimited: false,
      resetTime: null,
      paymentStatus: "PAID"
    }
  }

  // For free users, apply rate limiting
  const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD
  console.log(`🔍 [getRateLimitStatus] Checking for date: ${today}`)

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
    `📊 [getRateLimitStatus] Count: ${rateLimitData.generationCount}/${totalDailyLimit} (base: ${FREE_TIER_DAILY_LIMIT}, bonus: ${rateLimitData.bonusUses || 0}), Remaining: ${remaining}, Limited: ${isLimited}`
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
    paymentStatus
  }
}

/**
 * Increment the generation counter for free users
 */
export async function incrementGenerationCount(): Promise<void> {
  const today = new Date().toISOString().split("T")[0]
  console.log(`⬆️ [incrementGenerationCount] Called for date: ${today}`)

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
 */
export async function checkAndIncrementIfAllowed(userId: string): Promise<{
  canGenerate: boolean
  message: string | null
  newCount: number
}> {
  const today = new Date().toISOString().split("T")[0]

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
          `⬆️ [checkAndIncrementIfAllowed] Incremented to ${data.generationCount}`
        )

        chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
          console.log(
            `✅ [checkAndIncrementIfAllowed] Saved count: ${data.generationCount}`
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
  userId: string
): Promise<"PAID" | "PENDING" | "EXPIRED" | "NOT_FOUND" | "ERROR"> {
  try {
    if (!userId) {
      console.warn("⚠️ No user ID provided for payment check")
      return "NOT_FOUND"
    }

    const { data, error } = await supabase
      .from("payments")
      .select("payway_status, expires_at, created_at")
      .eq("user_id", userId)
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
export async function syncPaymentStatusOnLogin(userId: string): Promise<void> {
  try {
    console.log("🔄 Syncing payment status for user:", userId)
    const status = await checkPaymentStatus(userId)

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
 * Grant login bonus uses (3 uses) when user logs in after hitting the limit
 */
export async function grantLoginBonus(): Promise<void> {
  const today = new Date().toISOString().split("T")[0]
  console.log(`🎁 [grantLoginBonus] Checking for login bonus eligibility`)

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
