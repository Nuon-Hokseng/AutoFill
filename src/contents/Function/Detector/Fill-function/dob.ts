import { FIELD_KEYWORDS } from "../keyword"
import { getAssociatedLabelText, matchesAny } from "../utils"
import { detectDOBInputs, triggerInputEvents } from "../dobInputHelper"

const DOB_KEYWORDS: string[] = ([] as string[]).concat(
  ...Object.values(FIELD_KEYWORDS)
)

export interface DOBselect {
  day: HTMLInputElement | HTMLSelectElement | null
  month: HTMLSelectElement | null
  year: HTMLInputElement | HTMLSelectElement | null
}

//trigger event detection to select inputt form
function triggerSelectEvents(el: HTMLSelectElement, value: string): void {
  el.focus?.()

  // Assign the value (if it exists in options)
  const option = Array.from(el.options).find((opt) => opt.value === value)
  if (option) {
    el.value = option.value
    el.selectedIndex = option.index
  }

  // Fire events so frameworks catch the change
  el.dispatchEvent(new Event("change", { bubbles: true }))
  el.dispatchEvent(new Event("input", { bubbles: true }))

  el.blur?.()
}

export function detectDOBFields(): DOBselect {
  const dobselect: DOBselect = { day: null, month: null, year: null }

  // ====== DETECT SELECT INPUTS (existing logic) ======
  const selectInput = Array.from(
    document.querySelectorAll<HTMLSelectElement>("select")
  )
  for (const select of selectInput) {
    const name = select.getAttribute("name") || ""
    const value = (select.getAttribute("value") || "").toLowerCase()
    const id = (select.getAttribute("id") || "").toLowerCase()
    const labelText = getAssociatedLabelText(select).toLowerCase()

    const isDOBField =
      matchesAny(name, DOB_KEYWORDS) ||
      matchesAny(id, DOB_KEYWORDS) ||
      matchesAny(labelText, DOB_KEYWORDS)

    if (isDOBField) {
      // Priority check: Use numeric values first (most reliable)
      if (value === "1" && name.toLowerCase().includes("day")) {
        dobselect.day = select
        console.log("Found day DOB select with value 1")
      } else if (value === "1" && name.toLowerCase().includes("month")) {
        dobselect.month = select
        console.log("Found month DOB select with value 1")
      } else if (value === "1" && name.toLowerCase().includes("year")) {
        dobselect.year = select
        console.log("Found year DOB select with value 1")
      } else if (
        !dobselect.day &&
        (matchesAny(value, ["day", "birth_day", "dob_day", "date_day"]) ||
          matchesAny(id, ["day", "birth_day", "dob_day", "date_day"]) ||
          matchesAny(labelText, ["day", "birth day", "date of birth day"]))
      ) {
        dobselect.day = select
        console.log("Found day select with text-based detection")
      } else if (
        !dobselect.month &&
        (matchesAny(value, [
          "month",
          "birth_month",
          "dob_month",
          "date_month"
        ]) ||
          matchesAny(id, ["month", "birth_month", "dob_month", "date_month"]) ||
          matchesAny(labelText, [
            "month",
            "birth month",
            "date of birth month",
            "mm"
          ]))
      ) {
        dobselect.month = select
        console.log("Found month select with text-based detection")
      } else if (
        !dobselect.year &&
        (matchesAny(value, ["year", "birth_year", "dob_year", "date_year"]) ||
          matchesAny(id, ["year", "birth_year", "dob_year", "date_year"]) ||
          matchesAny(labelText, [
            "year",
            "birth year",
            "date of birth year",
            "yyyy"
          ]))
      ) {
        dobselect.year = select
        console.log("Found year select with text-based detection")
      }
    }
  }

  // ====== DETECT INPUT FIELDS (NEW LOGIC) ======
  detectDOBInputs(dobselect, DOB_KEYWORDS)

  return dobselect
}

export async function fillDOB(
  dobSelect: DOBselect,
  dob: string
): Promise<boolean> {
  if (!dob || !dobSelect) return false

  const [day, month, year] = dob.split("-")

  let filledSomething = false
  if (dobSelect.day && day) {
    try {
      console.log(`Filling DOB day field with value: ${day}`)
      if (dobSelect.day instanceof HTMLInputElement) {
        triggerInputEvents(dobSelect.day, day)
      } else {
        triggerSelectEvents(dobSelect.day, day)
      }
      filledSomething = true
    } catch (error) {
      console.error("Error filling DOB day field:", error)
    }
  }

  if (dobSelect.month && month) {
    try {
      const monthValue = String(parseInt(month))
      console.log(`Filling DOB month field with value: ${month}`)
      triggerSelectEvents(dobSelect.month, monthValue)
      filledSomething = true
    } catch (error) {
      console.error("Error filling DOB month field:", error)
    }
  }

  if (dobSelect.year && year) {
    try {
      console.log(`Filling DOB year field with value: ${year}`)
      if (dobSelect.year instanceof HTMLInputElement) {
        triggerInputEvents(dobSelect.year, year)
      } else {
        triggerSelectEvents(dobSelect.year, year)
      }
      filledSomething = true
    } catch (error) {
      console.error("Error filling DOB year field:", error)
    }
  }

  if (!filledSomething) {
    console.warn("No DOB elements found or dob string is invalid")
  }

  return filledSomething
}
