// contents/autofill.ts - Main autofill orchestrator
import {
  detectDOBFields,
  detectGenderFields,
  fillDOB,
  fillEmail,
  fillFirstName,
  fillGender,
  fillLastName,
  fillPassword,
  fillUsername,
  getAssociatedLabel
} from "./Function/fill-info"
import { detectFields } from "./Function/fill-info/fieldDetector"

console.log("Autofill content script loaded")

// Main detection function that finds all credential fields
function detectCredentialFields() {
  const inputs = Array.from(
    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      "input, textarea, select"
    )
  ) as HTMLInputElement[]

  // Detect each field type using specialized functions
  // Use the combined scoring detector
  const scored = detectFields(inputs)
  const emailEl = scored.email as HTMLInputElement | null
  const usernameEl = scored.username as HTMLInputElement | null
  const passwordEl = scored.password as HTMLInputElement | null
  const firstnameEl = scored.firstname as HTMLInputElement | null
  const lastnameEl = scored.lastname as HTMLInputElement | null
  const genderRadios = detectGenderFields()
  const dobSelect = detectDOBFields()

  return {
    emailEl,
    usernameEl,
    passwordEl,
    firstnameEL: firstnameEl,
    lastnameEL: lastnameEl,
    genderRadios,
    dobSelect
  }
}

// Re-run detection when new inputs are added dynamically (throttled)
let lastDetect = 0
function ensureFreshDetection() {
  const now = Date.now()
  if (now - lastDetect < 500) return
  lastDetect = now
  return detectCredentialFields()
}

// Observe DOM changes for dynamically injected forms/inputs
try {
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (
        Array.from(m.addedNodes || []).some((n) => {
          if (n instanceof Element) {
            return Boolean(n.querySelector("input, textarea, select"))
          }
          return false
        })
      ) {
        lastDetect = 0
        break
      }
    }
  })

  observer.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true
  })
} catch (e) {
  // ignore observer errors on restricted pages
}

// Fill function: accepts credentials object
async function fillCredentials(credentials: {
  email?: string
  username?: string
  password?: string
  firstname?: string
  lastname?: string
  gender?: string
  dob?: string
}) {
  try {
    // Prefer a fresh detection pass (throttled) if available, otherwise fallback
    const detection = ensureFreshDetection() || detectCredentialFields()

    const {
      emailEl,
      usernameEl,
      passwordEl,
      firstnameEL,
      lastnameEL,
      genderRadios,
      dobSelect
    } = detection
    console.log("Detected fields:", {
      email: emailEl ? `${emailEl.tagName}[${emailEl.type || "text"}]` : null,
      username: usernameEl
        ? `${usernameEl.tagName}[${usernameEl.type || "text"}]`
        : null,
      password: passwordEl
        ? `${passwordEl.tagName}[${passwordEl.type || "text"}]`
        : null,
      firstname: firstnameEL
        ? `${firstnameEL.tagName}[${firstnameEL.type || "text"}]`
        : null,
      lastname: lastnameEL
        ? `${lastnameEL.tagName}[${lastnameEL.type || "text"}]`
        : null,
      genderMale: genderRadios.male
        ? `Found male radio (value: ${genderRadios.male.value})`
        : null,
      genderFemale: genderRadios.female
        ? `Found female radio (value: ${genderRadios.female.value})`
        : null,
      genderCustom: genderRadios.custom
        ? `Found custom radio (value: ${genderRadios.custom.value})`
        : null,
      dobDay: dobSelect.day ? "Found day select" : null,
      dobMonth: dobSelect.month ? "Found month select" : null,
      dobYear: dobSelect.year ? "Found year select" : null
    })

    let fieldsCount = 0
    // Count how many fields were detected (potential fields to fill)
    const totalDetected = [
      !!firstnameEL,
      !!lastnameEL,
      !!usernameEl,
      !!emailEl,
      !!passwordEl,
      !!(
        genderRadios &&
        (genderRadios.male || genderRadios.female || genderRadios.custom)
      ),
      !!(dobSelect && (dobSelect.day || dobSelect.month || dobSelect.year))
    ].reduce((s, v) => s + (v ? 1 : 0), 0)

    // Fill fields using specialized functions
    if (firstnameEL && credentials.firstname) {
      const success = await fillFirstName(firstnameEL, credentials.firstname)
      if (success) fieldsCount++
    }

    if (lastnameEL && credentials.lastname) {
      const success = await fillLastName(lastnameEL, credentials.lastname)
      if (success) fieldsCount++
    }

    if (usernameEl && credentials.username) {
      const success = await fillUsername(usernameEl, credentials.username)
      if (success) fieldsCount++
    }

    if (emailEl && credentials.email) {
      const success = await fillEmail(emailEl, credentials.email)
      if (success) fieldsCount++
    }

    if (passwordEl && credentials.password) {
      const success = await fillPassword(passwordEl, credentials.password)
      if (success) fieldsCount++
    }

    if (credentials.gender && genderRadios) {
      const success = await fillGender(genderRadios, credentials.gender)
      if (success) fieldsCount++
    }

    if (dobSelect && credentials.dob) {
      const success = await fillDOB(dobSelect, credentials.dob)
      if (success) fieldsCount++
    }

    setTimeout(() => {
      const allInputs = document.querySelectorAll(
        'input[value]:not([value=""]), textarea[value]:not([value=""])'
      )
      allInputs.forEach((input) => {
        const element = input as HTMLInputElement
        const label = getAssociatedLabel(element)
        if (label && element.value) {
          label.classList.add("active", "filled", "shrink", "float")
        }
      })

      console.log(
        `Successfully filled ${fieldsCount} fields with proper label animations`
      )
    }, 200)

    if (fieldsCount === 0) {
      console.warn("No fields were found to fill!")
    }

    return { filled: fieldsCount, total: totalDetected }
  } catch (error) {
    console.error("Error during autofill:", error)
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("Content script received message:", msg)

  if (msg?.type === "AUTOFILL_CREDENTIALS") {
    chrome.storage.local.get("autofillData", (res) => {
      if (res.autofillData) {
        console.log("Loaded credentials from storage:", res.autofillData)
        fillCredentials(res.autofillData).then((result) => {
          sendResponse({ success: true, ...(result || {}) })
        })
      } else {
        console.warn("No saved autofill data found!")
        sendResponse({ success: false, error: "No saved data" })
      }
    })
    return true // important for async response
  }

  sendResponse({ success: false, error: "Unknown message type" })
})
