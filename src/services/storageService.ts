// Storage service to manage autofill data (custom or auto-generated)
import type { DummyUserData } from "./geminiService"
import { getCachedOrGenerateData } from "./geminiService"

export interface AutofillData {
  username?: string
  email?: string
  password?: string
  firstname?: string
  lastname?: string
  dob?: string
  gender?: string
  zipcode?: string
  postalcode?: string
}

/**
 * Get autofill data - checks custom data first, falls back to Gemini-generated data
 */
export async function getAutofillData(): Promise<{
  data: AutofillData | null
  source: "custom" | "generated" | "none"
}> {
  return new Promise((resolve) => {
    // First, check if user has saved custom data
    chrome.storage.local.get("autofillData", async (res) => {
      const customData = res.autofillData as AutofillData | undefined

      // Check if custom data exists and has at least one field filled
      const hasCustomData =
        customData &&
        Object.values(customData).some((value) => value && value.trim() !== "")

      if (hasCustomData) {
        console.log("📝 Using custom user data")
        resolve({ data: customData, source: "custom" })
        return
      }

      // No custom data, generate using Gemini API
      console.log("🤖 No custom data found, generating with Gemini API...")
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

/**
 * Save AI-generated data after first use
 * This allows users to see and reuse the generated data later
 */
export async function saveGeneratedDataAfterUse(
  data: AutofillData
): Promise<{ success: boolean }> {
  return new Promise((resolve) => {
    // Check if custom data already exists
    chrome.storage.local.get("autofillData", (res) => {
      const existingData = res.autofillData as AutofillData | undefined
      const hasExisting =
        existingData &&
        Object.values(existingData).some(
          (value) => value && value.trim() !== ""
        )

      // Only save if no custom data exists
      if (!hasExisting) {
        // Convert DOB from DD-MM-YYYY to YYYY-MM-DD for date input
        const dataToSave = { ...data }
        if (dataToSave.dob && dataToSave.dob.includes("-")) {
          const parts = dataToSave.dob.split("-")
          if (parts.length === 3) {
            const [day, month, year] = parts
            // Convert to YYYY-MM-DD format for HTML date input
            dataToSave.dob = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
          }
        }

        chrome.storage.local.set({ autofillData: dataToSave }, () => {
          if (chrome.runtime.lastError) {
            console.error(
              "Error saving generated data:",
              chrome.runtime.lastError
            )
            resolve({ success: false })
          } else {
            console.log("💾 AI-generated data saved for future reference")
            resolve({ success: true })
          }
        })
      } else {
        console.log("📝 Custom data exists, not overwriting")
        resolve({ success: false })
      }
    })
  })
}
