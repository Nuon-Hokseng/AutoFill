// Email field detection and filling functionality
import { FIELD_KEYWORDS } from "./fieldDetector"
import {
  fillFieldWithAnimation,
  getAssociatedLabelText,
  matchesAny
} from "./utils"

const EMAIL_KEYWORDS: string[] = ([] as string[]).concat(
  ...Object.values(FIELD_KEYWORDS)
)

export function detectEmailField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  let emailEl: HTMLInputElement | null = null

  // First pass: type-based detection
  for (const el of inputs) {
    const type = (el.getAttribute("type") || "").toLowerCase()
    if (!emailEl && type === "email") {
      emailEl = el
      console.log("Found email field by type attribute")
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
        getAssociatedLabelText(el)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      if (matchesAny(tagStr, EMAIL_KEYWORDS)) {
        emailEl = el
        console.log("Found email field by attribute matching")
        break
      }
    }
  }

  // Last resort: find input with '@' already in value (pre-filled)
  if (!emailEl) {
    const maybe = inputs.find((el) => el.value?.includes?.("@"))
    if (maybe) {
      emailEl = maybe
      console.log("Found email field by existing '@' symbol")
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
    console.log("Filling email field")
    await fillFieldWithAnimation(emailEl, email)
    return true
  } catch (error) {
    console.error("Error filling email field:", error)
    return false
  }
}
