// Password field detection and filling functionality
import { FIELD_KEYWORDS } from "../keyword"
import {
  fillFieldWithAnimation,
  getAssociatedLabelText,
  matchesAny
} from "../utils"

const PASSWORD_KEYWORDS: string[] = ([] as string[]).concat(
  ...Object.values(FIELD_KEYWORDS)
)

export function detectPasswordField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  let passwordEl: HTMLInputElement | null = null

  // First pass: type-based detection (most reliable)
  for (const el of inputs) {
    const type = (el.getAttribute("type") || "").toLowerCase()
    if (!passwordEl && type === "password") {
      passwordEl = el
      console.log("Found password field by type attribute")
      break
    }
  }

  // Second pass: attribute matching if type-based didn't work
  if (!passwordEl) {
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

      if (matchesAny(tagStr, PASSWORD_KEYWORDS)) {
        passwordEl = el
        console.log("Found password field by attribute matching")
        break
      }
    }
  }

  return passwordEl
}

export async function fillPassword(
  passwordEl: HTMLInputElement,
  password: string
): Promise<boolean> {
  if (!passwordEl || !password) return false

  try {
    console.log("Filling password field")
    await fillFieldWithAnimation(passwordEl, password)
    return true
  } catch (error) {
    console.error("Error filling password field:", error)
    return false
  }
}
