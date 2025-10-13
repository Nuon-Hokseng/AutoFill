import { getAssociatedLabelText, matchesAny } from "../Detector/utils"
import type { DOBselect } from "../Fill-function/dob"

export function triggerInputEvents(el: HTMLInputElement, value: string): void {
  el.focus?.()
  el.value = value
  el.dispatchEvent(new Event("input", { bubbles: true }))
  el.dispatchEvent(new Event("change", { bubbles: true }))
  el.blur?.()
}

export function detectDOBInputs(dobselect: DOBselect, keywords: string[]) {
  const inputs = Array.from(
    document.querySelectorAll<HTMLInputElement>("input")
  )
  for (const input of inputs) {
    const name = input.getAttribute("name") || ""
    const id = input.getAttribute("id") || ""
    const aria = input.getAttribute("aria-label") || ""
    const labelText = getAssociatedLabelText(input)

    const isDOBField =
      matchesAny(name, keywords) ||
      matchesAny(id, keywords) ||
      matchesAny(aria, keywords) ||
      matchesAny(labelText, keywords)

    if (isDOBField) {
      if (!dobselect.day && matchesAny(name + id + aria + labelText, ["day"])) {
        dobselect.day = input
        console.log("Found day DOB input")
      } else if (
        !dobselect.year &&
        matchesAny(name + id + aria + labelText, ["year"])
      ) {
        dobselect.year = input
        console.log("Found year DOB input")
      }
    }
  }
}
