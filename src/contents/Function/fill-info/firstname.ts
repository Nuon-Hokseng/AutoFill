// First name field detection and filling functionality
import {
  fillFieldWithAnimation,
  getAssociatedLabelText,
  matchesAny
} from "./utils"

const FIRSTNAME_KEYWORDS = [
  "First name",
  "first name",
  "First Name",
  "firstName",
  "firstname",
  "first_name",
  "given-name",
  "fname"
]

export function detectFirstNameField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  let firstnameEl: HTMLInputElement | null = null

  for (const el of inputs) {
    const tagStr = [
      el.getAttribute("firstname"),
      el.getAttribute("name"),
      el.getAttribute("id"),
      el.getAttribute("placeholder"),
      el.getAttribute("aria-label"),
      getAssociatedLabelText(el)
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    if (matchesAny(tagStr, FIRSTNAME_KEYWORDS)) {
      firstnameEl = el
      console.log("Found first name field by attribute matching")
      break
    }
  }

  return firstnameEl
}

export async function fillFirstName(
  firstnameEl: HTMLInputElement,
  firstname: string
): Promise<boolean> {
  if (!firstnameEl || !firstname) return false

  try {
    console.log("Filling first name field")
    await fillFieldWithAnimation(firstnameEl, firstname)
    return true
  } catch (error) {
    console.error("Error filling first name field:", error)
    return false
  }
}
