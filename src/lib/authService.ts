// authService.ts
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
  return data
}

export async function logout() {
  // Clear all local data before signing out
  await clearLocalData()

  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user
}
