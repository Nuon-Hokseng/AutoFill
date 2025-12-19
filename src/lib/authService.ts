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
        generation_count: 20, // remaining credits (starts at 20)
        last_reset_date: today,
        bonus_uses: 0,
        updated_at: new Date().toISOString()
      })
    }
  } catch (e) {}

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

  // Sync rate limit from database to ensure consistency across devices
  if (data?.user?.id) {
    await syncRateLimitFromDatabase(data.user.id)
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
  try {
    const {
      data: { session },
      error
    } = await supabase.auth.getSession()

    // Supabase throws AuthSessionMissingError when no session exists; treat as logged-out
    if (error?.message?.includes("Auth session missing")) return null
    if (error) throw error

    return session?.user ?? null
  } catch (error: any) {
    if (error?.message?.includes("Auth session missing")) return null
    throw error
  }
}
