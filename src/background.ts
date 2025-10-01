// Background script to relay messages between popup and content scripts
console.log("Background script loaded")
// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message)
  
  if (message.type === "TRIGGER_AUTOFILL") {
    // Getting info whether the tabs are active or not
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          type: "AUTOFILL_CREDENTIALS" 
        }, (response) => {
          console.log("Content script response:", response)
          sendResponse(response || { success: false })
        })
      } else {
        sendResponse({ success: false, error: "No active tab found" })
      }
    })
    return true
  }
})