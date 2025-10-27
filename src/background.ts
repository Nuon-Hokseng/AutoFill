// Background script to show messages between popup and content scripts
import { getAutofillData } from "~services/storageService"

console.log("Background script loaded")

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
