// Background script to show messages between popup and content scripts
import { hasCachedData, preloadData } from "~services/geminiService"
import {
  getAutofillData,
  hasCustomData,
  saveGeneratedDataAfterUse
} from "~services/storageService"

console.log("Background script loaded")

// Preload dummy data on extension startup (only if no custom data exists)
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
  const customDataExists = await hasCustomData()

  if (!customDataExists && !hasCachedData()) {
    console.log("🎯 No custom data found, preloading AI-generated data...")
    preloadData()
  } else if (customDataExists) {
    console.log("📝 Custom data exists, skipping preload")
  } else {
    console.log("📦 Data already cached")
  }
}

// Also preload when popup opens (if needed)
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popup") {
    hasCustomData().then((exists) => {
      if (!exists && !hasCachedData()) {
        console.log("🎯 Popup opened, ensuring data is preloaded...")
        preloadData()
      }
    })
  }
})

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message)

  if (message.type === "TRIGGER_AUTOFILL") {
    // Get autofill data (custom or generated)
    getAutofillData()
      .then(({ data, source }) => {
        if (!data) {
          console.error("❌ No autofill data available")
          sendResponse({
            success: false,
            error: "No data available",
            source: "none"
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

                // If autofill was successful and used generated data, save it for future reference
                if (response?.success && source === "generated") {
                  console.log("💾 Attempting to save generated data:", data)
                  saveGeneratedDataAfterUse(data).then((result) => {
                    if (result.success) {
                      console.log(
                        "✅ Generated data saved to storage for future use"
                      )
                      // Verify it was saved
                      chrome.storage.local.get("autofillData", (res) => {
                        console.log("✔️ Verified saved data:", res.autofillData)
                      })
                    } else {
                      console.log(
                        "⚠️ Data was not saved (custom data exists or error)"
                      )
                    }
                  })
                }

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
