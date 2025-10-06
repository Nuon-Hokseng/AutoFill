// contents/autofill.ts - Main autofill orchestrator
import {
  detectDOBFields,
  detectEmailField,
  detectFirstNameField,
  detectGenderFields,
  detectLastNameField,
  detectPasswordField,
  detectUsernameField,
  fillDOB,
  fillEmail,
  fillFirstName,
  fillGender,
  fillLastName,
  fillPassword,
  fillUsername,
  getAssociatedLabel,
  type DOBselect,
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
    const {
      emailEl,
      usernameEl,
      passwordEl,
      firstnameEL,
      lastnameEL,
      genderRadios,
      dobSelect
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
        : null,
      dobDay: dobSelect.day ? "Found day select" : null,
      dobMonth: dobSelect.month ? "Found month select" : null,
      dobYear: dobSelect.year ? "Found year select" : null
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

    // Handle date of birth selects
    if (dobSelect && credentials.dob) {
      const success = await fillDOB(dobSelect, credentials.dob)
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
      username: "seng cute",
      email: "test@example.com",
      password: "TestPassword123!",
      dob: "10-5-2010"
    }

    console.log("Filling credentials:", creds)
    fillCredentials(creds)
    sendResponse({ success: true })
    return true
  }

  sendResponse({ success: false, error: "Unknown message type" })
})
