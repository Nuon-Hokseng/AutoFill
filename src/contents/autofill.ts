// contents/autofill.ts - Main autofill orchestrator
import {
  detectEmailField,
  detectFirstNameField,
  detectGenderFields,
  detectLastNameField,
  detectPasswordField,
  detectUsernameField,
  fillEmail,
  fillFirstName,
  fillGender,
  fillLastName,
  fillPassword,
  fillUsername,
  getAssociatedLabel,
  type GenderRadios
} from "./Function/fill-info"

console.log("Autofill content script loaded")

// Main detection function that finds all credential fields
function detectCredentialFields() {
  const inputs = Array.from(
    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      "input, textarea, select"
    )
  ) as HTMLInputElement[]

  // Detect each field type using specialized functions
  const emailEl = detectEmailField(inputs)
  const usernameEl = detectUsernameField(inputs)
  const passwordEl = detectPasswordField(inputs)
  const firstnameEl = detectFirstNameField(inputs)
  const lastnameEl = detectLastNameField(inputs)
  const genderRadios = detectGenderFields()

  return {
    emailEl,
    usernameEl,
    passwordEl,
    firstnameEL: firstnameEl,
    lastnameEL: lastnameEl,
    genderRadios
  }
}

// Fill function: accepts credentials object
async function fillCredentials(credentials: {
  email?: string
  username?: string
  password?: string
  firstname?: string
  lastname?: string
  gender?: string
}) {
  try {
    const {
      emailEl,
      usernameEl,
      passwordEl,
      firstnameEL,
      lastnameEL,
      genderRadios
    } = detectCredentialFields()
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
        : null
    })

    let fieldsCount = 0

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

    // Handle gender radio buttons
    if (credentials.gender && genderRadios) {
      const success = await fillGender(genderRadios, credentials.gender)
      if (success) fieldsCount++
    }

    // Final cleanup: Ensure all labels are properly positioned
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
  } catch (error) {
    console.error("Error during autofill:", error)
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("Content script received message:", msg)

  if (msg?.type === "AUTOFILL_CREDENTIALS") {
    // Use test credentials for now
    const creds = {
      gender: "2", 
      firstname: "nuon",
      lastname: "hokseng",
      username: "sengZ",
      email: "test@example.com",
      password: "TestPassword123!"
    }

    console.log("Filling credentials:", creds)
    fillCredentials(creds)
    sendResponse({ success: true })
    return true
  }

  sendResponse({ success: false, error: "Unknown message type" })
})
