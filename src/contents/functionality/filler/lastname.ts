// Last name field detection and filling functionality
import { FIELD_KEYWORDS } from "../Detector/keyword"
import {
  fillFieldWithAnimation,
  getAssociatedLabelText,
  matchesAny
} from "../Detector/utils"

const LASTNAME_KEYWORDS: string[] = ([] as string[]).concat(
  ...Object.values(FIELD_KEYWORDS)
)

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
    await fillFieldWithAnimation(lastnameEl, lastname)
    return true
  } catch (error) {
    console.error("Error filling last name field:", error)
    return false
  }
}
