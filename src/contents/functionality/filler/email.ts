// Email field detection and filling functionality
import { FIELD_KEYWORDS } from "../Detector/keyword"
import {
  fillFieldWithAnimation,
  getAssociatedLabelText,
  matchesAny
} from "../Detector/utils"

// Narrow to email-specific keywords to avoid overmatching to names/usernames
const EMAIL_KEYWORDS: string[] = FIELD_KEYWORDS.email

export function detectEmailField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  let emailEl: HTMLInputElement | null = null

  // First pass: type-based detection
  for (const el of inputs) {
    const type = (el.getAttribute("type") || "").toLowerCase()
    if (!emailEl && type === "email") {
      emailEl = el
      break
    }
  }

  // Second pass: attribute matching if type-based didn't work
  if (!emailEl) {
    for (const el of inputs) {
      const tagStr = [
        el.getAttribute("name"),
        el.getAttribute("id"),
        el.getAttribute("placeholder"),
        el.getAttribute("aria-label"),
        el.getAttribute("autocomplete"),
        el.getAttribute("data-test"),
        el.getAttribute("data-testid"),
        el.getAttribute("data-field"),
        el.getAttribute("data-name"),
        getAssociatedLabelText(el)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      if (matchesAny(tagStr, EMAIL_KEYWORDS)) {
        emailEl = el
        break
      }
    }
  }

  // Last resort: find input with '@' already in value (pre-filled)
  if (!emailEl) {
    const maybe = inputs.find((el) => el.value?.includes?.("@"))
    if (maybe) {
      emailEl = maybe
    }
  }

  return emailEl
}

export async function fillEmail(
  emailEl: HTMLInputElement,
  email: string
): Promise<boolean> {
  if (!emailEl || !email) return false

  try {
    await fillFieldWithAnimation(emailEl, email)
    // Validate value took effect; some UIs ignore synthetic input
    if (emailEl.value !== email) {
      // Fallback: direct set + simple events
      emailEl.value = email
      emailEl.dispatchEvent(new Event("input", { bubbles: true }))
      emailEl.dispatchEvent(new Event("change", { bubbles: true }))
    }
    return emailEl.value === email
  } catch (error) {
    console.error("Error filling email field:", error)
    return false
  }
}
