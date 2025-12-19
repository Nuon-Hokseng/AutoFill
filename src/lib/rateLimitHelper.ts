// Helper utility for handling rate limit messages and user interactions
import { getUser } from "./authService"
import {
  getRateLimitStatus,
  incrementGenerationCount
} from "./rateLimitService"

/**
 * Check if user can generate new data
 * For logged-in users: checks database per user_id (clears local storage)
 * For logged-out users: checks local storage
 * Returns { canGenerate, message, status }
 */
export async function canGenerateData(): Promise<{
  canGenerate: boolean
  message: string | null
  paymentStatus: "PAID" | "PENDING" | "EXPIRED" | "NOT_FOUND" | "ERROR" | null
  remaining: number
}> {
  try {
    const user = await getUser()

    if (!user) {
      // Check device-based rate limit for non-logged-in users
      const rateLimitStatus = await getRateLimitStatus()

      if (rateLimitStatus.isLimited) {
        const resetTime = rateLimitStatus.resetTime
          ? new Date(rateLimitStatus.resetTime).toLocaleTimeString()
          : "tomorrow"
        return {
          canGenerate: false,
          message: `Daily limit reached (20/20 uses). Resets at ${resetTime}.`,
          paymentStatus: null,
          remaining: 0
        }
      }

      return {
        canGenerate: true,
        message: null,
        paymentStatus: null,
        remaining: rateLimitStatus.remaining
      }
    }

    // User is logged in - check database (per-account limit)
    // NOTE: We do NOT clear local cache here because:
    // 1. It's already cleared in login() when user logs in
    // 2. Clearing it on every check would reset the logged-in user's limit
    const rateLimitStatus = await getRateLimitStatus(user.id)

    if (rateLimitStatus.paymentStatus === "PAID") {
      return {
        canGenerate: true,
        message: null,
        paymentStatus: "PAID",
        remaining: Infinity
      }
    }

    if (rateLimitStatus.paymentStatus === "PENDING") {
      return {
        canGenerate: true,
        message:
          "Payment processing. Unlimited access available once confirmed.",
        paymentStatus: "PENDING",
        remaining: rateLimitStatus.remaining
      }
    }

    if (rateLimitStatus.paymentStatus === "EXPIRED") {
      return {
        canGenerate: false,
        message: "Premium subscription expired. Renew to continue.",
        paymentStatus: "EXPIRED",
        remaining: 0
      }
    }

    if (rateLimitStatus.isLimited) {
      const resetTime = rateLimitStatus.resetTime
        ? new Date(rateLimitStatus.resetTime).toLocaleTimeString()
        : "tomorrow"
      return {
        canGenerate: false,
        message: `Daily limit reached (20/20 uses). Resets at ${resetTime}.`,
        paymentStatus: "NOT_FOUND",
        remaining: 0
      }
    }

    return {
      canGenerate: true,
      message: null,
      paymentStatus: "NOT_FOUND",
      remaining: rateLimitStatus.remaining
    }
  } catch (error) {
    console.error("Error checking generation capability:", error)
    return {
      canGenerate: true,
      message: null,
      paymentStatus: null,
      remaining: 3
    }
  }
}

/**
 * Show user-friendly error message using chrome notification
 */
export async function showRateLimitNotification(): Promise<void> {
  try {
    const { canGenerate, message, paymentStatus, remaining } =
      await canGenerateData()

    if (!canGenerate && message) {
      // Try to show notification
      chrome.notifications.create({
        type: "basic",
        iconUrl: chrome.runtime.getURL("icon.png"),
        title: "Rate Limit Reached",
        message: message,
        priority: 2
      })
    }
  } catch (error) {
    console.error("Failed to show rate limit notification:", error)
  }
}

/**
 * Get user-friendly status message
 */
export async function getStatusMessage(): Promise<string> {
  const { canGenerate, message, remaining, paymentStatus } =
    await canGenerateData()

  if (paymentStatus === "PAID") {
    return "Premium: Unlimited access"
  }

  if (!canGenerate && message) {
    return message
  }

  if (remaining === Infinity) {
    return "Premium: Unlimited access"
  }

  if (remaining > 0) {
    return `${remaining}/20 uses remaining today`
  }

  return "Daily limit reached"
}

// Re-export for convenience
export {
  incrementGenerationCount,
  checkAndIncrementIfAllowed
} from "./rateLimitService"
