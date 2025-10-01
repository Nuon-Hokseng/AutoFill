// Last name field detection and filling functionality
import {
  fillFieldWithAnimation,
  getAssociatedLabelText,
  matchesAny
} from "./utils"

const LASTNAME_KEYWORDS = [
  "Last name",
  "lastName",
  "lastname",
  "last_name",
  "family-name",
  "familyName",
  "familyname",
  "lname",
  "surname",
  "SurName",
  "surName"
]

export function detectLastNameField(
  inputs: HTMLInputElement[]
): HTMLInputElement | null {
  let lastnameEl: HTMLInputElement | null = null

  for (const el of inputs) {
    const tagStr = [
      el.getAttribute("lastname"),
      el.getAttribute("name"),
      el.getAttribute("id"),
      el.getAttribute("placeholder"),
      el.getAttribute("aria-label"),
      getAssociatedLabelText(el)
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    if (matchesAny(tagStr, LASTNAME_KEYWORDS)) {
      lastnameEl = el
      console.log("Found last name field by attribute matching")
      break
    }
  }

  return lastnameEl
}

export async function fillLastName(
  lastnameEl: HTMLInputElement,
  lastname: string
): Promise<boolean> {
  if (!lastnameEl || !lastname) return false

  try {
    console.log("Filling last name field")
    await fillFieldWithAnimation(lastnameEl, lastname)
    return true
  } catch (error) {
    console.error("Error filling last name field:", error)
    return false
  }
}
