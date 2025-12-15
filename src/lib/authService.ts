// authService.ts
import { clearLocalRateLimit } from "./rateLimitService"
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
  return data
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) throw error

  // Clear local rate limit cache when user logs in
  await clearLocalRateLimit()
  console.log("✅ [authService.login] Rate limit cache cleared after login")

  return data
}

export async function logout() {
  // Clear all local data before signing out
  await clearLocalData()

  // Clear local rate limit cache when user logs out
  await clearLocalRateLimit()
  console.log("✅ [authService.logout] Rate limit cache cleared after logout")

  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user
}
