import { getAssociatedLabelText, matchesAny } from "../Detector/utils"
import type { DOBselect } from "../filler/dob"

export function triggerInputEvents(el: HTMLInputElement, value: string): void {
  el.focus?.()
  el.value = value
  el.dispatchEvent(new Event("input", { bubbles: true }))
  el.dispatchEvent(new Event("change", { bubbles: true }))
  el.blur?.()
}

// Helper to split camelCase strings for better matching
function splitCamelCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()
}

export function detectDOBInputs(dobselect: DOBselect, keywords: string[]) {
  const inputs = Array.from(
    document.querySelectorAll<HTMLInputElement>("input")
  )
  for (const input of inputs) {
    const name = input.getAttribute("name") || ""
    const id = input.getAttribute("id") || ""
    const aria = input.getAttribute("aria-label") || ""
    const ariaLabelledBy = input.getAttribute("aria-labelledby") || ""
    const labelText = getAssociatedLabelText(input)

    // Apply camelCase splitting to name and id
    const nameSplit = splitCamelCase(name)
    const idSplit = splitCamelCase(id)

    // Check for aria-labelledby references
    let ariaLabelledByText = ""
    if (ariaLabelledBy) {
      const ids = ariaLabelledBy.split(/\s+/)
      ariaLabelledByText = ids
        .map((id) => document.getElementById(id)?.textContent?.trim() || "")
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
    }

    // Combine all text for matching
    const combinedText = [
      name,
      nameSplit,
      id,
      idSplit,
      aria,
      labelText,
      ariaLabelledByText
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    const isDOBField =
      matchesAny(name, keywords) ||
      matchesAny(nameSplit, keywords) ||
      matchesAny(id, keywords) ||
      matchesAny(idSplit, keywords) ||
      matchesAny(aria, keywords) ||
      matchesAny(labelText, keywords) ||
      matchesAny(ariaLabelledByText, keywords)

    if (isDOBField) {
      // More specific matching for day/month/year
      const dayKeywords = [
        "day",
        "birth day",
        "dob day",
        "date day",
        "birth_day",
        "dob_day",
        "date_day",
        "dd",
        "birthDay",
        "dobDay",
        "dateDay"
      ]
      const monthKeywords = [
        "month",
        "birth month",
        "dob month",
        "date month",
        "birth_month",
        "dob_month",
        "date_month",
        "mm",
        "birthMonth",
        "dobMonth",
        "dateMonth"
      ]
      const yearKeywords = [
        "year",
        "birth year",
        "dob year",
        "date year",
        "birth_year",
        "dob_year",
        "date_year",
        "yyyy",
        "birthYear",
        "dobYear",
        "dateYear"
      ]

      if (!dobselect.day && matchesAny(combinedText, dayKeywords)) {
        dobselect.day = input
      } else if (!dobselect.month && matchesAny(combinedText, monthKeywords)) {
        dobselect.month = input as any // Allow input for month field
      } else if (!dobselect.year && matchesAny(combinedText, yearKeywords)) {
        dobselect.year = input
      }
    }
  }
}
