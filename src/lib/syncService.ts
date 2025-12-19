// Sync service to synchronize data between Chrome storage and Supabase
import {
  decrypt,
  encrypt,
  encryptAndStore,
  generateEncryptionPassword,
  retrieveAndDecrypt
} from "./encryptionService"
import { syncRateLimitFromDatabase } from "./rateLimitService"
import { supabase } from "./supabaseClient"

// Custom field data interface - ALL fields from custom tab
interface CustomFieldData {
  // Basic Info
  firstname?: string
  middlename?: string
  lastname?: string
  fullname?: string

  // Account
  username?: string
  email?: string
  password?: string

  // Personal
  gender?: string
  dob?: string
  age?: string
  birthplace?: string

  // Company
  company?: string
  position?: string

  // Contact
  homephone?: string
  cellphone?: string
  website?: string

  // Address (now stored in custom_fields, not separate table)
  address1?: string
  address2?: string
  city?: string
  state?: string
  zipcode?: string
  postalcode?: string
  country?: string
}

interface SyncResult {
  success: boolean
  error?: string
  syncedAt?: number
}

async function getEncryptionPassword(): Promise<string | null> {
  try {
    let storageData = await chrome.storage.local.get(["user_id", "auth_token"])

    if (!storageData.user_id || !storageData.auth_token) {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (session?.access_token && user?.id) {
        await chrome.storage.local.set({
          user_id: user.id,
          auth_token: session.access_token,
          refresh_token: session.refresh_token
        })

        storageData = {
          user_id: user.id,
          auth_token: session.access_token
        }
      } else {
        return null
      }
    }

    return await generateEncryptionPassword(
      storageData.user_id,
      storageData.user_id
    )
  } catch (error) {
    console.error("Failed to get encryption password:", error)
    return null
  }
}

export async function syncProfileToSupabase(): Promise<SyncResult> {
  try {
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("❌ Auth error:", authError)
      return { success: false, error: `Auth error: ${authError.message}` }
    }

    if (!user) {
      console.error("❌ No user found")
      return { success: false, error: "User not authenticated" }
    }

    // Get data from Chrome storage
    const result = await chrome.storage.local.get("autofillData")
    const localData: CustomFieldData = result.autofillData || {}

    // Get encryption password
    const encryptionPassword = await getEncryptionPassword()
    if (!encryptionPassword) {
      return { success: false, error: "Failed to generate encryption password" }
    }

    console.log("🔐 Encrypting all data as single JSONB...")

    const encryptedData = await encrypt(localData, encryptionPassword)

    console.log("💾 Upserting single row to custom_fields...")

    const { data: upsertResult, error: upsertError } = await supabase
      .from("custom_fields")
      .upsert(
        {
          user_id: user.id,
          encrypted_data: JSON.stringify(encryptedData),
          encryption_version: "v1",
          last_encrypted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id" }
      )
      .select()

    if (upsertError) {
      console.error("❌ Custom fields sync error:", upsertError)
      return {
        success: false,
        error: `Sync failed: ${upsertError.message}`
      }
    }

    console.log("✅ Custom fields synced successfully (1 row)")

    // Update sync timestamp
    const syncedAt = Date.now()
    await chrome.storage.local.set({
      last_sync_timestamp: syncedAt,
      sync_pending: false
    })

    console.log("✅ All data synced to Supabase successfully")
    return { success: true, syncedAt }
  } catch (error: any) {
    console.error("Sync to Supabase failed:", error)
    return { success: false, error: error.message }
  }
}

export async function syncProfileFromSupabase(): Promise<SyncResult> {
  try {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    console.log("🔄 Fetching encrypted data from Supabase...")

    // Get encryption password
    const encryptionPassword = await getEncryptionPassword()
    if (!encryptionPassword) {
      return { success: false, error: "Failed to generate encryption password" }
    }

    // Fetch single row for user
    const { data: customFieldRow, error: fetchError } = await supabase
      .from("custom_fields")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("❌ Custom fields fetch error:", fetchError)
      return { success: false, error: fetchError.message }
    }

    if (!customFieldRow) {
      console.log("📭 No data found in cloud")
      return { success: true, syncedAt: Date.now() }
    }

    console.log("🔓 Decrypting data...")

    // Decrypt the entire JSONB object
    let decryptedData: CustomFieldData = {}

    try {
      if (customFieldRow.encrypted_data) {
        const encryptedPayload = JSON.parse(customFieldRow.encrypted_data)
        // decrypt() returns the parsed object directly, not a JSON string
        decryptedData = await decrypt(encryptedPayload, encryptionPassword)
        console.log("✅ Data decrypted successfully")
      }
    } catch (decryptError) {
      console.error("❌ Failed to decrypt data:", decryptError)
      return {
        success: false,
        error: "Failed to decrypt data. Wrong encryption key?"
      }
    }

    // Store in Chrome local storage
    await chrome.storage.local.set({ autofillData: decryptedData })

    // Update sync timestamp
    const syncedAt = Date.now()
    await chrome.storage.local.set({
      last_sync_timestamp: syncedAt,
      sync_pending: false
    })

    // Also sync rate limit from database to ensure consistency across devices
    await syncRateLimitFromDatabase(user.id)
    console.log("✅ Rate limit synced from database")

    console.log("✅ All data synced from Supabase successfully")
    return { success: true, syncedAt }
  } catch (error: any) {
    console.error("Sync from Supabase failed:", error)
    return { success: false, error: error.message }
  }
}

export async function syncWebsiteProfilesToSupabase(): Promise<SyncResult> {
  try {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    // Get website profiles from Chrome storage
    const result = await chrome.storage.local.get("websiteProfiles")
    const localProfiles = result.websiteProfiles || []

    if (localProfiles.length === 0) {
      return { success: true, syncedAt: Date.now() }
    }

    // Get encryption password
    const encryptionPassword = await getEncryptionPassword()
    if (!encryptionPassword) {
      return { success: false, error: "Failed to generate encryption password" }
    }

    for (const profile of localProfiles) {
      const isValidUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          profile.id
        )
      const profileId = isValidUUID ? profile.id : crypto.randomUUID()

      const encryptedData = await encrypt(profile.data, encryptionPassword)

      const { error } = await supabase.from("website_profiles").upsert(
        {
          id: profileId,
          user_id: user.id,
          website_name: profile.website,
          website_url: profile.url,
          filled_fields: JSON.stringify(encryptedData),
          field_names: profile.filledFields,
          last_filled_at: new Date(profile.timestamp).toISOString(),
          updated_at: new Date().toISOString()
        },
        { onConflict: "id" }
      )

      if (error) {
        console.error("Failed to upsert profile:", profile.website, error)
        console.error("Error details:", JSON.stringify(error, null, 2))
        return {
          success: false,
          error: `Database error: ${error.message}. Check if RLS policy exists.`
        }
      }
    }

    const syncedAt = Date.now()
    await chrome.storage.local.set({ last_sync_timestamp: syncedAt })

    console.log("✅ Website profiles synced to Supabase")
    return { success: true, syncedAt }
  } catch (error: any) {
    console.error("Website profiles sync failed:", error)
    return { success: false, error: error.message }
  }
}

export async function syncWebsiteProfilesFromSupabase(): Promise<SyncResult> {
  try {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    const encryptionPassword = await getEncryptionPassword()
    if (!encryptionPassword) {
      return { success: false, error: "Failed to generate encryption password" }
    }

    const { data: profiles, error } = await supabase
      .from("website_profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("last_filled_at", { ascending: false })

    if (error) {
      console.error("Website profiles fetch error:", error)
      return { success: false, error: error.message }
    }

    // Convert to local format and decrypt
    const localProfiles = await Promise.all(
      (profiles || []).map(async (p) => {
        let decryptedData = {}

        try {
          // Check if filled_fields is encrypted (JSON string with ciphertext)
          if (typeof p.filled_fields === "string") {
            const encryptedPayload = JSON.parse(p.filled_fields)
            if (encryptedPayload.ciphertext) {
              // Data is encrypted, decrypt it
              decryptedData = await decrypt(
                encryptedPayload,
                encryptionPassword
              )
            } else {
              // Data is plain JSON string, parse it
              decryptedData = encryptedPayload
            }
          } else {
            // Data is already an object (old unencrypted format)
            decryptedData = p.filled_fields
          }
        } catch (decryptError) {
          console.error("Failed to decrypt profile data:", decryptError)
          // If decryption fails, use empty object
          decryptedData = {}
        }

        return {
          id: p.id,
          website: p.website_name,
          url: p.website_url,
          timestamp: new Date(p.last_filled_at).getTime(),
          data: decryptedData,
          filledFields: p.field_names
        }
      })
    )

    // Store in Chrome storage
    await chrome.storage.local.set({ websiteProfiles: localProfiles })

    const syncedAt = Date.now()
    await chrome.storage.local.set({ last_sync_timestamp: syncedAt })

    console.log("✅ Website profiles synced from Supabase")
    return { success: true, syncedAt }
  } catch (error: any) {
    console.error("Website profiles sync from Supabase failed:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Full sync - both upload and download
 */
export async function fullSync(): Promise<SyncResult> {
  try {
    // Upload local data first
    const uploadResult = await syncProfileToSupabase()
    if (!uploadResult.success) {
      return uploadResult
    }

    const websiteUploadResult = await syncWebsiteProfilesToSupabase()
    if (!websiteUploadResult.success) {
      return websiteUploadResult
    }

    // Then download to ensure we have the latest
    const downloadResult = await syncProfileFromSupabase()
    if (!downloadResult.success) {
      return downloadResult
    }

    const websiteDownloadResult = await syncWebsiteProfilesFromSupabase()
    if (!websiteDownloadResult.success) {
      return websiteDownloadResult
    }

    console.log("✅ Full sync completed successfully")
    return { success: true, syncedAt: Date.now() }
  } catch (error: any) {
    console.error("Full sync failed:", error)
    return { success: false, error: error.message }
  }
}

export async function markSyncPending(): Promise<void> {
  await chrome.storage.local.set({ sync_pending: true })
}

export async function isSyncPending(): Promise<boolean> {
  const result = await chrome.storage.local.get("sync_pending")
  return result.sync_pending === true
}

export async function getLastSyncTime(): Promise<number | null> {
  const result = await chrome.storage.local.get("last_sync_timestamp")
  return result.last_sync_timestamp || null
}

export async function clearLocalData(): Promise<void> {
  try {
    await chrome.storage.local.remove([
      "autofillData",
      "websiteProfiles",
      "enabledFields",
      "customLayout",
      "user_id",
      "auth_token",
      "refresh_token",
      "last_sync_timestamp",
      "sync_pending"
    ])
    console.log("✅ Local data cleared successfully")
  } catch (error) {
    console.error("Failed to clear local data:", error)
  }
}
