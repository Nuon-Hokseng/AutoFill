// First name field detection and filling functionality
import { FIELD_KEYWORDS } from "../Detector/keyword"
import {
  fillFieldWithAnimation,
  getAssociatedLabelText,
  matchesAny
} from "../Detector/utils"

// Restrict matching to only firstname-related keywords (avoid overmatching)
const FIRSTNAME_KEYWORDS: string[] = FIELD_KEYWORDS.firstname

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

    if (
      matchesAny(tagStr, FIRSTNAME_KEYWORDS) ||
      // direct autocomplete token for first name
      /(given[-_]name)/.test(tagStr) ||
      // common camelCase patterns
      /firstName|givenName/.test(tagStr)
    ) {
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
