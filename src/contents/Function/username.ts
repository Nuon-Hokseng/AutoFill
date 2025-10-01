// Username field detection and filling functionality
import {
  fillFieldWithAnimation,
  getAssociatedLabelText,
  matchesAny
} from "./utils"

const USERNAME_KEYWORDS = [
  "username",
  "user",
  "login",
  "user_name",
  "user-id",
  "userid"
]

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

  // Fallback: find first suitable text input that's not email/password
  if (!usernameEl) {
    const candidate = inputs.find((el) => {
      const type = (el.getAttribute("type") || "text").toLowerCase()

      // Skip non-text inputs
      if (
        [
          "hidden",
          "email",
          "password",
          "submit",
          "button",
          "checkbox",
          "radio"
        ].includes(type)
      ) {
        return false
      }

      // Skip inputs that are clearly other things
      const name = (el.getAttribute("name") || "").toLowerCase()
      if (
        matchesAny(name, [
          "search",
          "q",
          "phone",
          "tel",
          "address",
          "city",
          "zip"
        ])
      ) {
        return false
      }

      return true
    })

    if (candidate) {
      usernameEl = candidate
      console.log("Found username field by fallback heuristics")
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
