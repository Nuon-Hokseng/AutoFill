// Additional field detection and filling functions
import { FIELD_KEYWORDS } from "../Detector/keyword"
import {
  fillFieldWithAnimation,
  getAssociatedLabelText,
  matchesAny
} from "../Detector/utils"

function findByKeywords(
  inputs: HTMLInputElement[],
  keywords: string[]
): HTMLInputElement | null {
  for (const el of inputs) {
    const tagStr = [
      el.getAttribute("name"),
      el.getAttribute("id"),
      el.getAttribute("placeholder"),
      el.getAttribute("aria-label"),
      getAssociatedLabelText(el)
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    if (matchesAny(tagStr, keywords)) {
      return el
    }
  }
  return null
}

// Generic detect/fill generator style functions below
export function detectTitleField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.title)
}

export async function fillTitle(
  el: HTMLInputElement,
  value: string
): Promise<boolean> {
  if (!el || !value) return false
  try {
    await fillFieldWithAnimation(el, value)
    return true
  } catch (e) {
    console.error("Error filling title:", e)
    return false
  }
}

export function detectMiddleNameField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.middlename)
}

export async function fillMiddleName(
  el: HTMLInputElement,
  value: string
): Promise<boolean> {
  if (!el) return false
  try {
    await fillFieldWithAnimation(el, value)
    return true
  } catch (e) {
    console.error("Error filling middle name:", e)
    return false
  }
}

export function detectMiddleInitialField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.middleinitial)
}

export function detectFullNameField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.fullname)
}

export async function fillFullName(
  el: HTMLInputElement,
  value: string
): Promise<boolean> {
  if (!el) return false
  try {
    await fillFieldWithAnimation(el, value)
    return true
  } catch (e) {
    console.error("Error filling full name:", e)
    return false
  }
}

export function detectCompanyField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.company)
}

export async function fillCompany(
  el: HTMLInputElement,
  value: string
): Promise<boolean> {
  if (!el) return false
  try {
    await fillFieldWithAnimation(el, value)
    return true
  } catch (e) {
    console.error("Error filling company:", e)
    return false
  }
}

export function detectPositionField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.position)
}

export async function fillPosition(
  el: HTMLInputElement,
  value: string
): Promise<boolean> {
  if (!el) return false
  try {
    await fillFieldWithAnimation(el, value)
    return true
  } catch (e) {
    console.error("Error filling position:", e)
    return false
  }
}

export function detectAddressLine1Field(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.address1)
}

export function detectAddressLine2Field(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.address2)
}

export async function fillAddressLine(
  el: HTMLInputElement,
  value: string
): Promise<boolean> {
  if (!el) return false
  try {
    await fillFieldWithAnimation(el, value)
    return true
  } catch (e) {
    console.error("Error filling address line:", e)
    return false
  }
}

export function detectHomePhoneField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.homephone)
}

export function detectWorkPhoneField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.workphone)
}

export function detectFaxField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.fax)
}

export function detectCellPhoneField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.cellphone)
}

export async function fillPhoneField(
  el: HTMLInputElement,
  value: string
): Promise<boolean> {
  if (!el) return false
  try {
    await fillFieldWithAnimation(el, value)
    return true
  } catch (e) {
    console.error("Error filling phone field:", e)
    return false
  }
}

export function detectWebsiteField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  // also try input[type=url]
  for (const el of inputs) {
    const t = (el.getAttribute("type") || "").toLowerCase()
    if (t === "url") return el
  }
  return findByKeywords(inputs, FIELD_KEYWORDS.website)
}

export async function fillWebsite(
  el: HTMLInputElement,
  value: string
): Promise<boolean> {
  if (!el) return false
  try {
    await fillFieldWithAnimation(el, value)
    return true
  } catch (e) {
    console.error("Error filling website:", e)
    return false
  }
}

export function detectUserIdField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.userid)
}

export function detectCreditCardTypeField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.creditcardtype)
}

export function detectCreditCardNumberField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  // also try inputmode=numeric or pattern
  for (const el of inputs) {
    const t = (el.getAttribute("type") || "").toLowerCase()
    const im = (el.getAttribute("inputmode") || "").toLowerCase()
    if (
      matchesAny(el.getAttribute("name") || "", FIELD_KEYWORDS.creditcardnumber)
    )
      return el
    if (t === "tel" || t === "number" || im === "numeric") {
      const tagStr = [
        el.getAttribute("name"),
        el.getAttribute("id"),
        el.getAttribute("placeholder"),
        el.getAttribute("aria-label"),
        getAssociatedLabelText(el)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      if (matchesAny(tagStr, FIELD_KEYWORDS.creditcardnumber)) return el
    }
  }
  return findByKeywords(inputs, FIELD_KEYWORDS.creditcardnumber)
}

export function detectCardVerificationCodeField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.cardverificationcode)
}

export function detectCardExpirationField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.cardexpiration)
}

export function detectCardUserNameField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.cardusername)
}

export function detectCardIssuingBankField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.cardissuingbank)
}

export function detectCardCustomerServicePhoneField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.cardcustomerservicephone)
}

export function detectSSNField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.ssn)
}

export function detectDriverLicenseField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.driverslicense)
}

export function detectAgeField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.age)
}

export function detectBirthPlaceField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.birthplace)
}

export function detectIncomeField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.income)
}

export function detectCustomMessageField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.custommessage)
}

export function detectCommentsField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.comments)
}

// City, State, Zipcode, Country detectors (these were in Agorithms but needed direct accessors)
export function detectCityField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.city)
}

export function detectStateField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.state)
}

export function detectZipcodeField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.zipcode)
}

export function detectCountryField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  return findByKeywords(inputs, FIELD_KEYWORDS.country)
}

// Generic filler used for many of the above
export async function genericFill(
  el: HTMLInputElement | HTMLSelectElement,
  value: string
): Promise<boolean> {
  if (!el) return false
  try {
    // Handle select elements specially
    if (el.tagName === "SELECT") {
      const selectEl = el as HTMLSelectElement

      // Try exact match first
      for (let i = 0; i < selectEl.options.length; i++) {
        const option = selectEl.options[i]
        if (
          option.value.toLowerCase() === value.toLowerCase() ||
          option.text.toLowerCase() === value.toLowerCase()
        ) {
          selectEl.selectedIndex = i
          selectEl.value = option.value

          // Trigger events for frameworks
          selectEl.dispatchEvent(
            new Event("change", { bubbles: true, composed: true })
          )
          selectEl.dispatchEvent(
            new Event("input", { bubbles: true, composed: true })
          )
          return true
        }
      }

      // Try partial match
      for (let i = 0; i < selectEl.options.length; i++) {
        const option = selectEl.options[i]
        if (
          option.value.toLowerCase().includes(value.toLowerCase()) ||
          option.text.toLowerCase().includes(value.toLowerCase())
        ) {
          selectEl.selectedIndex = i
          selectEl.value = option.value

          selectEl.dispatchEvent(
            new Event("change", { bubbles: true, composed: true })
          )
          selectEl.dispatchEvent(
            new Event("input", { bubbles: true, composed: true })
          )
          return true
        }
      }

      return false
    }

    // Handle regular input/textarea
    await fillFieldWithAnimation(el as HTMLInputElement, value)
    return true
  } catch (e) {
    console.error("❌ Error filling generic field:", e)
    return false
  }
}

export default {}
