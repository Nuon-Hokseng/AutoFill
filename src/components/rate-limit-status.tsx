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

  // If user is paid or we detect infinite limit, show premium card (minimal)
  if (stats.paymentStatus === "PAID" || !isFinite(stats.dailyLimit)) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-green-900">
            Premium: Unlimited access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-green-800">You're all set.</p>
        </CardContent>
      </Card>
    )
  }

  // Payment pending or expired - warn user
  if (stats.paymentStatus === "PENDING") {
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-800 text-sm">
          Payment processing. Unlimited access available once confirmed.
        </p>
      </div>
    )
  }

  if (stats.paymentStatus === "EXPIRED") {
    return (
      <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
        <p className="text-orange-800 text-sm">
          Premium expired. Renew to continue.
        </p>
      </div>
    )
  }

  // Free user - show rate limit status
  const remaining = Math.max(0, stats.dailyLimit - stats.generationCount)
  const isLimited = remaining <= 0
  const progressPercent = Math.min(stats.percentageUsed, 100)

  return (
    <Card
      className={
        isLimited ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
      }>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          {isLimited ? "Daily limit reached" : "Daily limit"}
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
        <div className="flex justify-between items-center text-xs text-gray-800">
          <span>
            <strong>
              {stats.generationCount}/{stats.dailyLimit}
            </strong>{" "}
            today
          </span>
          <span>Resets {new Date(stats.lastReset).toLocaleDateString()}</span>
        </div>

        {remaining > 0 && (
          <p className="text-xs text-gray-700">{remaining} remaining today</p>
        )}
      </CardContent>
    </Card>
  )
}

export default RateLimitStatus
