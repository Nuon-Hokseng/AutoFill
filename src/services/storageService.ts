// Storage service to manage autofill data (custom or auto-generated)
import type { DummyUserData } from "./geminiService"
import { getCachedOrGenerateData } from "./geminiService"

export interface AutofillData {
  // Basic Info
  title?: string
  firstname?: string
  middlename?: string
  middleinitial?: string
  lastname?: string
  fullname?: string

  // Contact Info
  email?: string
  username?: string
  password?: string

  // Personal Details
  gender?: string
  dob?: string
  age?: string
  birthplace?: string
  ssn?: string
  driverslicense?: string

  // Company/Work
  company?: string
  position?: string

  // Address
  address1?: string
  address2?: string
  city?: string
  state?: string
  zipcode?: string
  postalcode?: string
  country?: string

  // Phone Numbers
  homephone?: string
  workphone?: string
  fax?: string
  cellphone?: string

  // Web
  website?: string
  userid?: string

  // Payment Info
  creditcardtype?: string
  creditcardnumber?: string
  cardverificationcode?: string
  cardexpiration?: string
  cardusername?: string
  cardissuingbank?: string
  cardcustomerservicephone?: string

  // Additional
  income?: string
  custommessage?: string
  comments?: string
}

/**
 * Get AI mode setting
 */
export async function getAIMode(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get("aiModeEnabled", (res) => {
      // Default to true (AI enabled by default)
      resolve(res.aiModeEnabled !== false)
    })
  })
}

/**
 * Set AI mode setting
 */
export async function setAIMode(
  enabled: boolean
): Promise<{ success: boolean }> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ aiModeEnabled: enabled }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving AI mode:", chrome.runtime.lastError)
        resolve({ success: false })
      } else {
        console.log(`✅ AI mode ${enabled ? "enabled" : "disabled"}`)
        resolve({ success: true })
      }
    })
  })
}

/**
 * Get autofill data - checks custom data first, then AI data if AI mode is enabled
 */
export async function getAutofillData(): Promise<{
  data: AutofillData | null
  source: "custom" | "generated" | "none"
}> {
  return new Promise((resolve) => {
    // First, check if user has saved custom data
    chrome.storage.local.get(["autofillData", "aiModeEnabled"], async (res) => {
      const customData = res.autofillData as AutofillData | undefined
      const aiModeEnabled = res.aiModeEnabled !== false // Default to true

      // Check if custom data exists and has at least one field filled
      const hasCustomData =
        customData &&
        Object.values(customData).some((value) => value && value.trim() !== "")

      if (hasCustomData) {
        console.log("📝 Using custom user data (overrides AI)")
        resolve({ data: customData, source: "custom" })
        return
      }

      // No custom data - check if AI mode is enabled
      if (!aiModeEnabled) {
        console.log("🚫 AI mode disabled, no data available")
        resolve({ data: null, source: "none" })
        return
      }

      // AI mode enabled, generate data
      console.log("🤖 AI mode enabled, generating data...")
      const generatedData = await getCachedOrGenerateData()

      if (generatedData) {
        console.log("✅ Using Gemini-generated data")
        resolve({ data: generatedData, source: "generated" })
      } else {
        console.warn("⚠️ Failed to generate data, no data available")
        resolve({ data: null, source: "none" })
      }
    })
  })
}

/**
 * Save custom autofill data
 */
export async function saveCustomData(
  data: AutofillData
): Promise<{ success: boolean }> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ autofillData: data }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving custom data:", chrome.runtime.lastError)
        resolve({ success: false })
      } else {
        console.log("✅ Custom data saved successfully")
        resolve({ success: true })
      }
    })
  })
}

/**
 * Clear custom autofill data
 */
export async function clearCustomData(): Promise<{ success: boolean }> {
  return new Promise((resolve) => {
    chrome.storage.local.remove("autofillData", () => {
      if (chrome.runtime.lastError) {
        console.error("Error clearing custom data:", chrome.runtime.lastError)
        resolve({ success: false })
      } else {
        console.log("✅ Custom data cleared successfully")
        resolve({ success: true })
      }
    })
  })
}

/**
 * Check if custom data exists
 */
export async function hasCustomData(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get("autofillData", (res) => {
      const customData = res.autofillData as AutofillData | undefined
      const hasData =
        customData &&
        Object.values(customData).some((value) => value && value.trim() !== "")
      resolve(!!hasData)
    })
  })
}
