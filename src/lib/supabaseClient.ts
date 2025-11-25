// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js"


const supabaseUrl = process.env.PLASMO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY


export const supabase = createClient(supabaseUrl, supabaseAnonKey)