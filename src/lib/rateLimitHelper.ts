// Helper utility for handling rate limit messages and user interactions
import { getUser } from "./authService"
import {
  getRateLimitStatus,
  incrementGenerationCount
} from "./rateLimitService"

/**
 * Check if user can generate new data
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
      const rateLimitStatus = await getRateLimitStatus("device-local")

      if (rateLimitStatus.isLimited) {
        const resetTime = rateLimitStatus.resetTime
          ? new Date(rateLimitStatus.resetTime).toLocaleTimeString()
          : "tomorrow"
        return {
          canGenerate: false,
          message: `⛔ You've reached your daily limit of 3 auto-generates. Log in to get 3 bonus uses! Or come back ${resetTime}.`,
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
          "⏳ Your payment is being processed. You'll get unlimited access once confirmed.",
        paymentStatus: "PENDING",
        remaining: rateLimitStatus.remaining
      }
    }

    if (rateLimitStatus.paymentStatus === "EXPIRED") {
      return {
        canGenerate: false,
        message:
          "⏰ Your premium subscription has expired. Please renew to continue using auto-generate.",
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
        message: `⛔ You've reached your daily limit of 3 auto-generates. Come back ${resetTime} or upgrade to Premium for unlimited access.`,
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

      // Also alert as fallback
      console.warn(`🔴 ${message}`)
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
    return "✅ Premium: Unlimited auto-generate access"
  }

  if (!canGenerate && message) {
    return message
  }

  if (remaining === Infinity) {
    return "✅ Premium: Unlimited requests"
  }

  if (remaining > 0) {
    return `📊 Free: ${remaining}/3 auto-generates remaining today`
  }

  return "⛔ Daily limit reached"
}

// Re-export for convenience
export {
  incrementGenerationCount,
  checkAndIncrementIfAllowed
} from "./rateLimitService"
