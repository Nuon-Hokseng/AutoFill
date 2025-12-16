// Rate limit status component for dashboard
import { useEffect, useState } from "react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "~features/components/ui/card"
import { getUser } from "~lib/authService"
import {
  getCachedPaymentStatus,
  getRateLimitStats,
  syncRateLimitFromDatabase
} from "~lib/rateLimitService"

interface RateLimitStats {
  generationCount: number
  dailyLimit: number
  percentageUsed: number
  lastReset: string
  paymentStatus: "PAID" | "PENDING" | "EXPIRED" | "NOT_FOUND" | "ERROR" | null
}

export function RateLimitStatus() {
  const [stats, setStats] = useState<RateLimitStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        // First, sync rate limit from database if user is logged in
        try {
          const user = await getUser()
          if (user?.id) {
            await syncRateLimitFromDatabase(user.id)
            console.log("✅ [RateLimitStatus] Rate limit synced from database")
          }
        } catch (syncError) {
          console.warn(
            "⚠️ [RateLimitStatus] Failed to sync rate limit:",
            syncError
          )
        }

        // Then load the stats
        const limitStats = await getRateLimitStats()
        const paymentStatus = await getCachedPaymentStatus()

        setStats({
          ...limitStats,
          paymentStatus: (paymentStatus as any) || null
        })
      } catch (error) {
        console.error("Failed to load rate limit stats:", error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
    // Refresh every 30 seconds
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading || !stats) {
    return null
  }

  // If user is paid, don't show rate limit
  if (stats.paymentStatus === "PAID") {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-green-900 flex items-center gap-2">
            <span className="text-lg">✅</span> Premium Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-green-800">
            Unlimited auto-generate data access
          </p>
        </CardContent>
      </Card>
    )
  }

  // Payment pending or expired - warn user
  if (stats.paymentStatus === "PENDING") {
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-800 text-sm">
          ⏳ <strong>Payment Pending:</strong> Your payment is being processed.
          You'll get unlimited access once it's confirmed.
        </p>
      </div>
    )
  }

  if (stats.paymentStatus === "EXPIRED") {
    return (
      <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
        <p className="text-orange-800 text-sm">
          ⏰ <strong>Payment Expired:</strong> Your premium access has expired.
          Please renew to continue unlimited usage.
        </p>
      </div>
    )
  }

  // Free user - show rate limit status
  const remaining = stats.dailyLimit - stats.generationCount
  const isLimited = remaining <= 0
  const progressPercent = Math.min(stats.percentageUsed, 100)
  const baseLimit = 3
  const bonusUses = Math.max(0, stats.dailyLimit - baseLimit)

  return (
    <Card
      className={
        isLimited ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
      }>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          {isLimited
            ? "⛔ Daily Limit Reached"
            : "📊 Daily Auto-Generate Limit"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isLimited ? "bg-red-600" : "bg-blue-600"
            }`}
            style={{ width: `${progressPercent}%` }}></div>
        </div>

        {/* Stats */}
        <div className="flex justify-between items-center text-xs">
          <span className={isLimited ? "text-red-900" : "text-blue-900"}>
            <strong>
              {stats.generationCount}/{stats.dailyLimit}
            </strong>{" "}
            used today
            {bonusUses > 0 && (
              <span className="ml-1 text-green-700">
                (+{bonusUses} 🎁 bonus)
              </span>
            )}
          </span>
          <span className="text-gray-600">
            Resets: {new Date(stats.lastReset).toLocaleDateString()}
          </span>
        </div>

        {isLimited && bonusUses === 0 && (
          <p className="text-xs text-red-800 font-medium">
            Come back tomorrow or upgrade to Premium for unlimited access.
          </p>
        )}

        {isLimited && bonusUses > 0 && (
          <p className="text-xs text-green-800 font-medium">
            ✨ You have {bonusUses} bonus uses from logging in! Use them wisely.
          </p>
        )}

        {remaining > 0 && (
          <p className="text-xs text-blue-800">
            You have <strong>{remaining} requests</strong> remaining today.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default RateLimitStatus
