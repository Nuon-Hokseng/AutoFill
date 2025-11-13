// contents/autofill.ts - Main autofill orchestrator
import type { PlasmoCSConfig } from "plasmo"

import {
  detectAddressLine1Field,
  detectAddressLine2Field,
  detectAgeField,
  detectBirthPlaceField,
  detectCardExpirationField,
  detectCardVerificationCodeField,
  detectCellPhoneField,
  detectCityField,
  detectCommentsField,
  detectCompanyField,
  detectCountryField,
  detectCreditCardNumberField,
  detectDOBFields,
  detectDriverLicenseField,
  detectFaxField,
  detectFullNameField,
  detectGenderFields,
  detectHomePhoneField,
  detectIncomeField,
  detectMiddleNameField,
  detectPositionField,
  detectSSNField,
  detectStateField,
  // New field detectors
  detectTitleField,
  detectWebsiteField,
  detectWorkPhoneField,
  detectZipcodeField,
  fillAddressLine,
  fillCompany,
  fillDOB,
  fillEmail,
  fillFirstName,
  fillFullName,
  fillGender,
  fillLastName,
  fillMiddleName,
  fillPassword,
  fillPhoneField,
  fillPosition,
  fillTitle,
  fillUsername,
  fillWebsite,
  genericFill,
  getAssociatedLabel
} from "./functionality"
import { detectFields } from "./functionality/Detector/Agorithms"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true,
  run_at: "document_end"
}

console.log("🎯 Autofill content script loaded on:", window.location.href)

// Main detection function that finds all credential fields
// Recursively collect inputs across shadow roots
function collectInputsDeep(
  root: Document | ShadowRoot
): (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[] {
  const nodes: (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[] =
    []
  root.querySelectorAll("input, textarea, select").forEach((el) => {
    nodes.push(el as any)
  })
  // Traverse elements with shadow roots
  root.querySelectorAll("*").forEach((el) => {
    const anyEl = el as any
    if (anyEl.shadowRoot) {
      nodes.push(...collectInputsDeep(anyEl.shadowRoot))
    }
  })
  console.log(
    `🔍 Collected ${nodes.length} total input/select elements (including shadow DOM)`
  )

  // Debug: Log first few inputs to see what we're dealing with
  if (nodes.length > 0 && nodes.length <= 20) {
    console.log(
      "📝 All inputs found:",
      nodes.map((n) => ({
        tag: n.tagName,
        type: (n as HTMLInputElement).type,
        name: (n as HTMLInputElement).name,
        id: n.id,
        ariaLabelledBy: n.getAttribute("aria-labelledby"),
        visible: (n as HTMLElement).offsetParent !== null
      }))
    )
  } else if (nodes.length > 20) {
    console.log(
      "📝 First 10 inputs:",
      nodes.slice(0, 10).map((n) => ({
        tag: n.tagName,
        type: (n as HTMLInputElement).type,
        name: (n as HTMLInputElement).name,
        id: n.id,
        ariaLabelledBy: n.getAttribute("aria-labelledby")
      }))
    )
  }

  return nodes
}

function detectCredentialFields() {
  const inputs = collectInputsDeep(document) as HTMLInputElement[]

  // Detect each field type using specialized functions
  // Use the combined scoring detector
  const scored = detectFields(inputs)
  const emailEl = scored.email as HTMLInputElement | null
  const usernameEl = scored.username as HTMLInputElement | null

  // For password fields, detect ALL password inputs (not just first one)
  const passwordInputs = inputs.filter(
    (el) => el.type === "password" && (el as HTMLElement).offsetParent !== null
  )
  const passwordEl =
    passwordInputs[0] || (scored.password as HTMLInputElement | null)
  const confirmPasswordEl = passwordInputs[1] || null

  console.log(`🔐 Found ${passwordInputs.length} password fields`)

  const firstnameEl = scored.firstname as HTMLInputElement | null
  const lastnameEl = scored.lastname as HTMLInputElement | null
  const genderRadios = detectGenderFields()
  const dobSelect = detectDOBFields()

  // Detect new fields
  const titleEl = detectTitleField(inputs)
  const middlenameEl = detectMiddleNameField(inputs)
  const fullnameEl = detectFullNameField(inputs)
  const companyEl = detectCompanyField(inputs)
  const positionEl = detectPositionField(inputs)
  const address1El = detectAddressLine1Field(inputs)
  const address2El = detectAddressLine2Field(inputs)
  const cityEl = detectCityField(inputs)
  const stateEl = detectStateField(inputs)
  const zipcodeEl = detectZipcodeField(inputs)
  const countryEl = detectCountryField(inputs)
  const phoneEl = scored.phone as HTMLInputElement | null // Generic phone field
  const homephoneEl = detectHomePhoneField(inputs)
  const workphoneEl = detectWorkPhoneField(inputs)
  const faxEl = detectFaxField(inputs)
  const cellphoneEl = detectCellPhoneField(inputs)
  const websiteEl = detectWebsiteField(inputs)
  const creditcardnumberEl = detectCreditCardNumberField(inputs)
  const cvvEl = detectCardVerificationCodeField(inputs)
  const cardexpirationEl = detectCardExpirationField(inputs)
  const ssnEl = detectSSNField(inputs)
  const driverslicenseEl = detectDriverLicenseField(inputs)
  const ageEl = detectAgeField(inputs)
  const birthplaceEl = detectBirthPlaceField(inputs)
  const incomeEl = detectIncomeField(inputs)
  const commentsEl = detectCommentsField(inputs)

  return {
    emailEl,
    usernameEl,
    passwordEl,
    confirmPasswordEl,
    firstnameEL: firstnameEl,
    lastnameEL: lastnameEl,
    genderRadios,
    dobSelect,
    // New fields
    titleEl,
    middlenameEl,
    fullnameEl,
    companyEl,
    positionEl,
    address1El,
    address2El,
    cityEl,
    stateEl,
    zipcodeEl,
    countryEl,
    phoneEl,
    homephoneEl,
    workphoneEl,
    faxEl,
    cellphoneEl,
    websiteEl,
    creditcardnumberEl,
    cvvEl,
    cardexpirationEl,
    ssnEl,
    driverslicenseEl,
    ageEl,
    birthplaceEl,
    incomeEl,
    commentsEl
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
      // Watch for new inputs being added
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

      // Also watch for attribute changes on inputs (like aria-labelledby being added)
      if (
        m.type === "attributes" &&
        m.target instanceof HTMLInputElement &&
        (m.attributeName === "aria-labelledby" ||
          m.attributeName === "aria-label" ||
          m.attributeName === "placeholder" ||
          m.attributeName === "name" ||
          m.attributeName === "id")
      ) {
        lastDetect = 0
        break
      }
    }
  })

  observer.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      "aria-labelledby",
      "aria-label",
      "placeholder",
      "name",
      "id"
    ]
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
  // New fields
  title?: string
  middlename?: string
  fullname?: string
  company?: string
  position?: string
  address1?: string
  address2?: string
  city?: string
  state?: string
  zipcode?: string
  country?: string
  homephone?: string
  workphone?: string
  fax?: string
  cellphone?: string
  website?: string
  creditcardnumber?: string
  cardverificationcode?: string
  cardexpiration?: string
  ssn?: string
  driverslicense?: string
  age?: string
  birthplace?: string
  income?: string
  comments?: string
}) {
  try {
    console.log("🚀 Starting autofill process with credentials:", {
      hasFirstname: !!credentials.firstname,
      hasLastname: !!credentials.lastname,
      hasEmail: !!credentials.email,
      hasCountry: !!credentials.country
    })

    // Prefer a fresh detection pass (throttled) if available, otherwise fallback
    const detection = ensureFreshDetection() || detectCredentialFields()

    const {
      emailEl,
      usernameEl,
      passwordEl,
      confirmPasswordEl,
      firstnameEL,
      lastnameEL,
      genderRadios,
      dobSelect,
      titleEl,
      middlenameEl,
      fullnameEl,
      companyEl,
      positionEl,
      address1El,
      address2El,
      cityEl,
      stateEl,
      zipcodeEl,
      countryEl,
      phoneEl,
      homephoneEl,
      workphoneEl,
      faxEl,
      cellphoneEl,
      websiteEl,
      creditcardnumberEl,
      cvvEl,
      cardexpirationEl,
      ssnEl,
      driverslicenseEl,
      ageEl,
      birthplaceEl,
      incomeEl,
      commentsEl
    } = detection

    console.log("📋 Detected fields:", {
      email: emailEl
        ? `${emailEl.tagName}[${emailEl.type || "text"}] name="${emailEl.name}" id="${emailEl.id}"`
        : "❌ NOT FOUND",
      username: usernameEl
        ? `${usernameEl.tagName}[${usernameEl.type || "text"}] name="${usernameEl.name}" id="${usernameEl.id}"`
        : "❌ NOT FOUND",
      password: passwordEl
        ? `${passwordEl.tagName}[${passwordEl.type || "text"}] name="${passwordEl.name}" id="${passwordEl.id}"`
        : "❌ NOT FOUND",
      confirmPassword: confirmPasswordEl
        ? `${confirmPasswordEl.tagName}[${confirmPasswordEl.type || "text"}] name="${confirmPasswordEl.name}" id="${confirmPasswordEl.id}"`
        : "❌ NOT FOUND",
      firstname: firstnameEL
        ? `${firstnameEL.tagName}[${firstnameEL.type || "text"}] name="${firstnameEL.name}" id="${firstnameEL.id}"`
        : "❌ NOT FOUND",
      lastname: lastnameEL
        ? `${lastnameEL.tagName}[${lastnameEL.type || "text"}] name="${lastnameEL.name}" id="${lastnameEL.id}"`
        : "❌ NOT FOUND",
      genderMale: genderRadios?.male
        ? `Found male radio (value: ${genderRadios.male.value})`
        : null,
      genderFemale: genderRadios?.female
        ? `Found female radio (value: ${genderRadios.female.value})`
        : null,
      genderCustom: genderRadios?.custom
        ? `Found custom radio (value: ${genderRadios.custom.value})`
        : null,
      dobDay: dobSelect?.day ? "Found day select" : null,
      dobMonth: dobSelect?.month ? "Found month select" : null,
      dobYear: dobSelect?.year ? "Found year select" : null,
      // Log new fields
      title: titleEl ? "Found title" : null,
      middlename: middlenameEl ? "Found middle name" : null,
      fullname: fullnameEl ? "Found full name" : null,
      company: companyEl ? "Found company" : null,
      position: positionEl ? "Found position" : null,
      address1: address1El ? "Found address line 1" : null,
      address2: address2El ? "Found address line 2" : null,
      city: cityEl
        ? `Found city: name="${(cityEl as HTMLInputElement).name}" id="${cityEl.id}"`
        : "❌ NOT FOUND",
      state: stateEl
        ? `Found state: name="${(stateEl as HTMLInputElement).name}" id="${stateEl.id}"`
        : "❌ NOT FOUND",
      zipcode: zipcodeEl
        ? `Found zipcode: name="${(zipcodeEl as HTMLInputElement).name}" id="${zipcodeEl.id}"`
        : "❌ NOT FOUND",
      country: countryEl
        ? `Found country: name="${(countryEl as HTMLInputElement).name}" id="${countryEl.id}" tagName="${countryEl.tagName}"`
        : "❌ NOT FOUND",
      phone: phoneEl
        ? `Found phone: name="${phoneEl.name}" id="${phoneEl.id}"`
        : "❌ NOT FOUND",
      homephone: homephoneEl ? "Found home phone" : null,
      workphone: workphoneEl ? "Found work phone" : null,
      fax: faxEl ? "Found fax" : null,
      cellphone: cellphoneEl ? "Found cell phone" : null,
      website: websiteEl ? "Found website" : null,
      creditcard: creditcardnumberEl ? "Found credit card" : null,
      cvv: cvvEl ? "Found CVV" : null,
      cardexpiration: cardexpirationEl ? "Found card expiration" : null,
      ssn: ssnEl ? "Found SSN" : null,
      driverslicense: driverslicenseEl ? "Found driver license" : null,
      age: ageEl ? "Found age" : null,
      birthplace: birthplaceEl ? "Found birth place" : null,
      income: incomeEl ? "Found income" : null,
      comments: commentsEl ? "Found comments" : null
    })

    let fieldsCount = 0

    // Count how many fields were detected (potential fields to fill)
    const detectedElements = [
      firstnameEL,
      lastnameEL,
      usernameEl,
      emailEl,
      passwordEl,
      titleEl,
      middlenameEl,
      fullnameEl,
      companyEl,
      positionEl,
      address1El,
      address2El,
      cityEl,
      stateEl,
      zipcodeEl,
      countryEl,
      homephoneEl,
      workphoneEl,
      faxEl,
      cellphoneEl,
      websiteEl,
      creditcardnumberEl,
      cvvEl,
      cardexpirationEl,
      ssnEl,
      driverslicenseEl,
      ageEl,
      birthplaceEl,
      incomeEl,
      commentsEl,
      genderRadios &&
        (genderRadios.male || genderRadios.female || genderRadios.custom),
      dobSelect && (dobSelect.day || dobSelect.month || dobSelect.year)
    ]
    const totalDetected = detectedElements.filter(Boolean).length

    // Fill fields using specialized functions
    if (titleEl && credentials.title) {
      const success = await fillTitle(titleEl, credentials.title)
      if (success) fieldsCount++
    }

    if (firstnameEL && credentials.firstname) {
      const success = await fillFirstName(firstnameEL, credentials.firstname)
      if (success) fieldsCount++
    }

    if (middlenameEl && credentials.middlename) {
      const success = await fillMiddleName(middlenameEl, credentials.middlename)
      if (success) fieldsCount++
    }

    if (lastnameEL && credentials.lastname) {
      const success = await fillLastName(lastnameEL, credentials.lastname)
      if (success) fieldsCount++
    }

    if (fullnameEl && credentials.fullname) {
      const success = await fillFullName(fullnameEl, credentials.fullname)
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

    if (confirmPasswordEl && credentials.password) {
      const success = await fillPassword(
        confirmPasswordEl,
        credentials.password
      )
      if (success) {
        fieldsCount++
        console.log("✅ Filled confirm password field")
      }
    }

    if (credentials.gender && genderRadios) {
      const success = await fillGender(genderRadios, credentials.gender)
      if (success) fieldsCount++
    }

    if (dobSelect && credentials.dob) {
      const success = await fillDOB(dobSelect, credentials.dob)
      if (success) fieldsCount++
    }

    // Company/Work fields
    if (companyEl && credentials.company) {
      const success = await fillCompany(companyEl, credentials.company)
      if (success) fieldsCount++
    }

    if (positionEl && credentials.position) {
      const success = await fillPosition(positionEl, credentials.position)
      if (success) fieldsCount++
    }

    // Address fields
    if (address1El && credentials.address1) {
      const success = await fillAddressLine(address1El, credentials.address1)
      if (success) fieldsCount++
    }

    if (address2El && credentials.address2) {
      const success = await fillAddressLine(address2El, credentials.address2)
      if (success) fieldsCount++
    }

    // City/State/Zipcode/Country fields
    if (cityEl && credentials.city) {
      const success = await genericFill(cityEl, credentials.city)
      if (success) fieldsCount++
    }

    if (stateEl && credentials.state) {
      const success = await genericFill(stateEl, credentials.state)
      if (success) fieldsCount++
    }

    if (zipcodeEl && credentials.zipcode) {
      const success = await genericFill(zipcodeEl, credentials.zipcode)
      if (success) fieldsCount++
    }

    if (countryEl && credentials.country) {
      const success = await genericFill(countryEl, credentials.country)
      if (success) fieldsCount++
    }

    // Phone fields
    // Try generic phone field first (most common, like Apple's phoneNumber)
    if (phoneEl && (credentials.cellphone || credentials.homephone)) {
      const phoneValue = credentials.cellphone || credentials.homephone || ""
      const success = await fillPhoneField(phoneEl, phoneValue)
      if (success) {
        fieldsCount++
        console.log("✅ Filled generic phone field")
      }
    }

    if (homephoneEl && credentials.homephone) {
      const success = await fillPhoneField(homephoneEl, credentials.homephone)
      if (success) fieldsCount++
    }

    if (workphoneEl && credentials.workphone) {
      const success = await fillPhoneField(workphoneEl, credentials.workphone)
      if (success) fieldsCount++
    }

    if (faxEl && credentials.fax) {
      const success = await fillPhoneField(faxEl, credentials.fax)
      if (success) fieldsCount++
    }

    if (cellphoneEl && credentials.cellphone) {
      const success = await fillPhoneField(cellphoneEl, credentials.cellphone)
      if (success) fieldsCount++
    }

    // Web fields
    if (websiteEl && credentials.website) {
      const success = await fillWebsite(websiteEl, credentials.website)
      if (success) fieldsCount++
    }

    // Payment fields
    if (creditcardnumberEl && credentials.creditcardnumber) {
      const success = await genericFill(
        creditcardnumberEl,
        credentials.creditcardnumber
      )
      if (success) fieldsCount++
    }

    if (cvvEl && credentials.cardverificationcode) {
      const success = await genericFill(cvvEl, credentials.cardverificationcode)
      if (success) fieldsCount++
    }

    if (cardexpirationEl && credentials.cardexpiration) {
      const success = await genericFill(
        cardexpirationEl,
        credentials.cardexpiration
      )
      if (success) fieldsCount++
    }

    // Personal ID fields
    if (ssnEl && credentials.ssn) {
      const success = await genericFill(ssnEl, credentials.ssn)
      if (success) fieldsCount++
    }

    if (driverslicenseEl && credentials.driverslicense) {
      const success = await genericFill(
        driverslicenseEl,
        credentials.driverslicense
      )
      if (success) fieldsCount++
    }

    if (ageEl && credentials.age) {
      const success = await genericFill(ageEl, credentials.age)
      if (success) fieldsCount++
    }

    if (birthplaceEl && credentials.birthplace) {
      const success = await genericFill(birthplaceEl, credentials.birthplace)
      if (success) fieldsCount++
    }

    // Additional fields
    if (incomeEl && credentials.income) {
      const success = await genericFill(incomeEl, credentials.income)
      if (success) fieldsCount++
    }

    if (commentsEl && credentials.comments) {
      const success = await genericFill(commentsEl, credentials.comments)
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

// Helper to wait for elements to be available
async function waitForElements(maxWait = 5000): Promise<boolean> {
  const startTime = Date.now()
  while (Date.now() - startTime < maxWait) {
    const inputs = document.querySelectorAll("input, select, textarea")
    if (inputs.length > 0) {
      console.log(
        `✅ Found ${inputs.length} form elements after ${Date.now() - startTime}ms`
      )
      return true
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  console.warn("⏱️ Timeout waiting for form elements")
  return false
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("Content script received message:", msg)

  if (msg?.type === "AUTOFILL_CREDENTIALS") {
    // Use data passed from background script (either custom or generated)
    const data = msg.data
    const source = msg.source || "unknown"

    if (data) {
      console.log(`📝 Using ${source} data for autofill:`, data)

      // Wait for form to be ready if needed
      waitForElements(3000).then(() => {
        // Small additional delay for any animations/transitions
        setTimeout(() => {
          fillCredentials(data).then((result) => {
            sendResponse({
              success: true,
              source: source,
              ...(result || {})
            })
          })
        }, 500)
      })
    } else {
      console.warn("No autofill data provided!")
      sendResponse({ success: false, error: "No data provided", source })
    }

    return true // important for async response
  }

  sendResponse({ success: false, error: "Unknown message type" })
})
