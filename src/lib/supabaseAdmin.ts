import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.PLASMO_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.PLASMO_SUPABASE_SERVICE_ROLE_KEY

// Optional admin client that bypasses RLS. Only use when you explicitly need
// to operate by user_id without an authenticated session. Ensure the service
// role key is set in env; otherwise this will be null.
export const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    : null
