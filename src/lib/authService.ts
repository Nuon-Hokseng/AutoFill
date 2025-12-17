// authService.ts
import {
  archiveLocalRateLimit,
  clearLocalRateLimit,
  restoreArchivedLocalRateLimit,
  syncRateLimitFromDatabase
} from "./rateLimitService"
import { supabase } from "./supabaseClient"
import { clearLocalData } from "./syncService"

export async function signup(
  email: string,
  password: string,
  metadata?: { full_name?: string; first_name?: string; last_name?: string }
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata || {}
    }
  })

  if (error) throw error

  // Initialize rate limit record with 3 remaining credits for new users
  try {
    const userId = data?.user?.id
    if (userId) {
      const today = new Date().toISOString().split("T")[0]
      await supabase.from("rate_limit_usage").insert({
        user_id: userId,
        generation_count: 3, // remaining credits (starts at 3)
        last_reset_date: today,
        bonus_uses: 0,
        updated_at: new Date().toISOString()
      })
    }
  } catch (e) {
    console.warn("⚠️ [signup] Failed to initialize rate_limit_usage:", e)
  }

  return data
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) throw error

  // Preserve guest rate limit, then clear device cache while logged in
  await archiveLocalRateLimit()
  await clearLocalRateLimit()
  console.log(
    "✅ [authService.login] Rate limit cache archived and cleared after login"
  )

  // Sync rate limit from database to ensure consistency across devices
  if (data?.user?.id) {
    await syncRateLimitFromDatabase(data.user.id)
    console.log(
      "✅ [authService.login] Rate limit synced from database after login"
    )
  }

  return data
}

export async function logout() {
  // Clear all local data before signing out
  await clearLocalData()

  // Restore previous guest rate limit so limits persist across sign-out
  await restoreArchivedLocalRateLimit()

  // NOTE: We do NOT clear rate limit cache on logout
  // This prevents users from bypassing local limits by logging out
  // Rate limit cache is only cleared on LOGIN to prevent cross-account contamination

  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user
}
