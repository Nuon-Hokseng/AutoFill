// Username field detection and filling functionality
import { FIELD_KEYWORDS } from "../keyword"
import {
  fillFieldWithAnimation,
  getAssociatedLabelText,
  matchesAny
} from "../utils"

const USERNAME_KEYWORDS: string[] = ([] as string[]).concat(
  ...Object.values(FIELD_KEYWORDS)
)

export function detectUsernameField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  let usernameEl: HTMLInputElement | null = null

  // First pass: attribute matching
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

    if (matchesAny(tagStr, USERNAME_KEYWORDS)) {
      usernameEl = el
      console.log("Found username field by attribute matching")
      break
    }
  }
  return usernameEl
}

export async function fillUsername(
  usernameEl: HTMLInputElement,
  username: string
): Promise<boolean> {
  if (!usernameEl || !username) return false

  try {
    console.log("Filling username field")
    await fillFieldWithAnimation(usernameEl, username)
    return true
  } catch (error) {
    console.error("Error filling username field:", error)
    return false
  }
}
