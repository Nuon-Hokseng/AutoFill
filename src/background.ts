// Background script to show messages between popup and content scripts
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
    // Get autofill data (custom or generated)
    getAutofillData()
      .then(async ({ data, source }) => {
        if (!data) {
          const aiEnabled = await getAIMode()
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
                console.log("Content script response:", response)

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

    return true // Important for async response
  }
})
