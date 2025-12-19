// Background script to show messages between popup and content scripts
import {
  canGenerateData,
  checkAndIncrementIfAllowed,
  incrementGenerationCount
} from "~lib/rateLimitHelper"
import { clearCache, hasCachedData, preloadData } from "~services/geminiService"
import { getAIMode, getAutofillData } from "~services/storageService"

console.log("Background script loaded")

// Initialize preload immediately when background script loads
initializePreload()

// Preload dummy data on extension startup if AI mode is enabled
chrome.runtime.onInstalled.addListener(() => {
  console.log("🔧 Extension installed/updated")
  initializePreload()
})

// Also preload on startup
chrome.runtime.onStartup.addListener(() => {
  console.log("🚀 Extension startup")
  initializePreload()
})

// Initialize preload logic
async function initializePreload() {
  const aiEnabled = await getAIMode()
  const hasCache = await hasCachedData()

  if (aiEnabled && !hasCache) {
    console.log("🎯 AI mode enabled, preloading AI-generated data...")
    preloadData()
  } else if (!aiEnabled) {
    console.log("🚫 AI mode disabled, skipping preload")
  } else {
    console.log("📦 Data already cached")
  }
}

// Check cache status when popup opens but don't preload (will load on-demand)
chrome.runtime.onConnect.addListener(async (port) => {
  if (port.name === "popup") {
    const hasCache = await hasCachedData()
    if (hasCache) {
      console.log("📦 Popup opened - data already cached")
    } else {
      console.log("📭 Popup opened - data will be generated on first use")
    }
  }
})

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message)

  if (message.type === "CLEAR_AI_CACHE") {
    try {
      clearCache()
      console.log("🗑️ Cache cleared, triggering preload...")
      // Immediately preload fresh data after clearing
      preloadData()
      sendResponse({ success: true })
    } catch (e: any) {
      console.error("Failed to clear AI cache:", e?.message || e)
      sendResponse({ success: false, error: e?.message || String(e) })
    }
    return true
  }

  if (message.type === "TRIGGER_AUTOFILL") {
    // Check if profile data is provided
    if (message.useProfileData) {
      // Send profile data directly to content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            {
              type: "AUTOFILL_CREDENTIALS",
              data: message.useProfileData,
              source: "profile"
            },
            (response) => {
              console.log("Content script response:", response)
              sendResponse({
                ...(response || { success: false }),
                source: "profile"
              })
            }
          )
        } else {
          sendResponse({ success: false, error: "No active tab found" })
        }
      })

      return true
    }

    // Check rate limit for AI-generated data
    canGenerateData()
      .then(async (rateLimitStatus) => {
        const aiEnabled = await getAIMode()

        // If AI mode is enabled but rate limit reached, block generation
        if (aiEnabled && !rateLimitStatus.canGenerate) {
          console.warn(
            `⛔ Rate limit reached for AI generation. Remaining: ${rateLimitStatus.remaining}`
          )
          sendResponse({
            success: false,
            error: rateLimitStatus.message,
            source: "none",
            aiEnabled: aiEnabled,
            rateLimited: true
          })
          return
        }

        // Get autofill data (custom or generated)
        getAutofillData()
          .then(async ({ data, source }) => {
            if (!data) {
              const errorMsg = aiEnabled
                ? "Failed to fetch dummy data from backend. Please try again."
                : "No custom data found. Please add custom credentials or enable AI mode."

              console.error("❌ No autofill data available:", errorMsg)
              sendResponse({
                success: false,
                error: errorMsg,
                source: "none",
                aiEnabled: aiEnabled
              })
              return
            }

            // If data comes from AI generation, check and increment the rate limit counter
            if (source === "generated" && aiEnabled) {
              try {
                console.log(`� Checking and incrementing generation count...`)

                // Prefer stored user_id; if missing, function falls back to session/local
                const storedUserId = await new Promise<string | undefined>(
                  (resolve) => {
                    chrome.storage.local.get("user_id", (res) =>
                      resolve(res?.user_id)
                    )
                  }
                )

                // Auto-detect user: logged-in users increment per-account in DB;
                // logged-out users increment local storage. Passing userId lets us
                // decrement even if there's no active auth session.
                const result = await checkAndIncrementIfAllowed(storedUserId)

                if (!result.canGenerate) {
                  // This shouldn't happen since we checked earlier, but safety check
                  console.warn(
                    `⛔ Rate limit enforced! (should have been caught earlier)`
                  )
                  sendResponse({
                    success: false,
                    error: result.message,
                    source: "none",
                    aiEnabled: aiEnabled,
                    rateLimited: true
                  })
                  return
                }

                console.log(
                  `✅ Generation count incremented to ${result.newCount}/20`
                )
              } catch (err) {
                console.error(
                  "Error incrementing generation count:",
                  err?.message || err
                )
                // Don't block the fill if counter increment fails
              }
            }

            console.log(`📤 Sending ${source} data to content script`)

            // Send data to content script
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs[0]?.id) {
                chrome.tabs.sendMessage(
                  tabs[0].id,
                  {
                    type: "AUTOFILL_CREDENTIALS",
                    data: data,
                    source: source
                  },
                  (response) => {
                    sendResponse({
                      ...(response || { success: false }),
                      source: source
                    })
                  }
                )
              } else {
                sendResponse({ success: false, error: "No active tab found" })
              }
            })
          })
          .catch((error) => {
            console.error("Error getting autofill data:", error)
            sendResponse({ success: false, error: error.message })
          })
      })
      .catch((error) => {
        console.error("Error checking rate limit:", error)
        sendResponse({ success: false, error: "Failed to check rate limit" })
      })

    return true
  }
})
