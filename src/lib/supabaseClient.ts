// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js"

// These names are special for Plasmo.
// It will automatically find them in your .env file (Step 3)
const supabaseUrl = process.env.PLASMO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY

// This is the "Universal Remote" you will import in all your pages
export const supabase = createClient(supabaseUrl, supabaseAnonKey)