// Username field detection and filling functionality
import { FIELD_KEYWORDS } from "../Detector/keyword"
import {
  fillFieldWithAnimation,
  getAssociatedLabelText,
  matchesAny
} from "../Detector/utils"

// Restrict to username-related keywords; avoid name/email collisions
const USERNAME_KEYWORDS: string[] = FIELD_KEYWORDS.username
const NAME_KEYWORDS: string[] = ([] as string[]).concat(
  FIELD_KEYWORDS.firstname,
  FIELD_KEYWORDS.lastname,
  FIELD_KEYWORDS.fullname
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

    // Ignore obvious name fields to prevent email/usernames from landing there
    if (matchesAny(tagStr, NAME_KEYWORDS)) {
      continue
    }

    // Favor elements explicitly tagged for usernames (including autocomplete)
    if (
      matchesAny(tagStr, USERNAME_KEYWORDS) ||
      /\buser\s?id\b|\blogin\b|\blogin id\b/.test(tagStr)
    ) {
      usernameEl = el
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
    await fillFieldWithAnimation(usernameEl, username)
    return true
  } catch (error) {
    console.error("Error filling username field:", error)
    return false
  }
}
