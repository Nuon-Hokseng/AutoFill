import { detectDOBInputs, triggerInputEvents } from "../Detector/dobInputHelper"
import { FIELD_KEYWORDS } from "../Detector/keyword"
import { getAssociatedLabelText, matchesAny } from "../Detector/utils"

// Keep DOB detection narrow so unrelated fields (like email) are not misclassified
const DOB_KEYWORDS: string[] = FIELD_KEYWORDS.dob

type DOBField = HTMLInputElement | HTMLSelectElement | HTMLElement

export interface DOBselect {
  day: DOBField | null
  month: DOBField | null
  year: DOBField | null
}

//trigger event detection to select inputt form
function triggerSelectEvents(el: HTMLSelectElement, value: string): boolean {
  el.focus?.()
  const option = Array.from(el.options).find((opt) => opt.value === value)
  if (option) {
    el.value = option.value
    el.selectedIndex = option.index
    el.dispatchEvent(new Event("change", { bubbles: true }))
    el.dispatchEvent(new Event("input", { bubbles: true }))
    el.blur?.()
    return true
  }
  el.blur?.()
  return false
}

function triggerListboxSelection(
  el: HTMLElement,
  value: string,
  kind: "day" | "month" | "year"
): boolean {
  const openCandidates: HTMLElement[] = []
  openCandidates.push(el)
  const toggle = el.querySelector<HTMLElement>("[aria-haspopup='listbox']")
  if (toggle) openCandidates.push(toggle)

  openCandidates.forEach((n) => n.click?.())

  const options = Array.from(
    el.querySelectorAll<HTMLElement>("[role='option'], li, [data-value]")
  )

  const monthNames = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december"
  ]

  const numeric = parseInt(value, 10)
  const monthIndex = Number.isNaN(numeric) ? -1 : numeric - 1
  const padded = value.padStart(2, "0")

  const candidates = (() => {
    if (kind === "month") {
      const names = monthIndex >= 0 ? [monthNames[monthIndex]] : []
      return [value, padded, String(numeric), ...names].filter(Boolean)
    }
    return [value, padded, String(numeric)].filter(Boolean)
  })().map((c) => c.toLowerCase())

  const matchOption = options.find((opt) => {
    const dataVal = (opt.getAttribute("data-value") || "").toLowerCase()
    const val = (opt.getAttribute("value") || "").toLowerCase()
    const text = (opt.textContent || "").trim().toLowerCase()

    return candidates.some(
      (cand) => cand === dataVal || cand === val || cand === text
    )
  })

  if (matchOption) {
    matchOption.click?.()
    el.dispatchEvent(new Event("change", { bubbles: true }))
    el.dispatchEvent(new Event("input", { bubbles: true }))
    return true
  }

  el.blur?.()
  return false
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
    const dataTestId = (select.getAttribute("data-testid") || "").toLowerCase()

    const optionTexts = Array.from(select.options).map((o) =>
      (o.textContent || o.value || "").trim().toLowerCase()
    )
    const numericOptions = optionTexts
      .map((t) => parseInt(t, 10))
      .filter((n) => !Number.isNaN(n))
    const monthNames = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december"
    ]
    const monthNameHits = optionTexts.filter((t) =>
      monthNames.includes(t)
    ).length
    const hasMonthSequence =
      numericOptions.length >= 12 &&
      numericOptions.every((n) => n >= 1 && n <= 12)
    const hasDaySequence =
      numericOptions.length >= 28 &&
      numericOptions.every((n) => n >= 1 && n <= 31)
    const fourDigitYears = numericOptions.filter(
      (n) => n >= 1900 && n <= new Date().getFullYear() + 10
    )
    const looksLikeMonthSelect = monthNameHits >= 6 || hasMonthSequence
    const looksLikeDaySelect = hasDaySequence && !looksLikeMonthSelect
    const looksLikeYearSelect = fourDigitYears.length >= 10

    // Fallback: inspect first disabled option text (often "Month", "Day", "Year")
    const firstDisabledOptionText = (() => {
      const firstDisabled = Array.from(select.options).find(
        (o) => o.disabled && o.textContent
      )
      return (firstDisabled?.textContent || "").trim().toLowerCase()
    })()

    const isDOBField =
      matchesAny(name, DOB_KEYWORDS) ||
      matchesAny(id, DOB_KEYWORDS) ||
      matchesAny(labelText, DOB_KEYWORDS) ||
      dataTestId.includes("select-day") ||
      dataTestId.includes("select-month") ||
      dataTestId.includes("select-year") ||
      ["day", "month", "year"].includes(firstDisabledOptionText) ||
      looksLikeMonthSelect ||
      looksLikeDaySelect ||
      looksLikeYearSelect

    if (isDOBField) {
      // Priority check: Use numeric values first (most reliable)
      if (dataTestId.includes("select-day") && !dobselect.day) {
        dobselect.day = select
      } else if (dataTestId.includes("select-month") && !dobselect.month) {
        dobselect.month = select
      } else if (dataTestId.includes("select-year") && !dobselect.year) {
        dobselect.year = select
      } else if (value === "1" && name.toLowerCase().includes("day")) {
        dobselect.day = select
      } else if (value === "1" && name.toLowerCase().includes("month")) {
        dobselect.month = select
      } else if (value === "1" && name.toLowerCase().includes("year")) {
        dobselect.year = select
      } else if (!dobselect.month && looksLikeMonthSelect) {
        dobselect.month = select
      } else if (!dobselect.day && looksLikeDaySelect) {
        dobselect.day = select
      } else if (!dobselect.year && looksLikeYearSelect) {
        dobselect.year = select
      } else if (
        !dobselect.day &&
        (matchesAny(value, ["day", "birth_day", "dob_day", "date_day"]) ||
          matchesAny(id, ["day", "birth_day", "dob_day", "date_day"]) ||
          matchesAny(labelText, ["day", "birth day", "date of birth day"]))
      ) {
        dobselect.day = select
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
      } else if (!dobselect.month && firstDisabledOptionText === "month") {
        dobselect.month = select
      } else if (!dobselect.day && firstDisabledOptionText === "day") {
        dobselect.day = select
      } else if (!dobselect.year && firstDisabledOptionText === "year") {
        dobselect.year = select
      }
    }
  }

  // ====== DETECT LISTBOX DROPDOWNS (custom UI components) ======
  const listboxes = Array.from(
    document.querySelectorAll<HTMLElement>("[role='listbox']")
  )
  for (const listbox of listboxes) {
    const name = listbox.getAttribute("name") || ""
    const id = listbox.getAttribute("id") || ""
    const ariaLabel = listbox.getAttribute("aria-label") || ""
    const dataLabel = listbox.getAttribute("data-label") || ""
    const labelText = [ariaLabel, dataLabel].filter(Boolean).join(" ")

    const optionTexts = Array.from(
      listbox.querySelectorAll<HTMLElement>("[role='option'], li")
    ).map((o) =>
      (o.textContent || o.getAttribute("data-value") || "").trim().toLowerCase()
    )

    const numericOptions = optionTexts
      .map((t) => parseInt(t, 10))
      .filter((n) => !Number.isNaN(n))
    const monthNames = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december"
    ]
    const monthNameHits = optionTexts.filter((t) =>
      monthNames.includes(t)
    ).length
    const hasMonthSequence =
      numericOptions.length >= 12 &&
      numericOptions.every((n) => n >= 1 && n <= 12)
    const hasDaySequence =
      numericOptions.length >= 28 &&
      numericOptions.every((n) => n >= 1 && n <= 31)
    const fourDigitYears = numericOptions.filter(
      (n) => n >= 1900 && n <= new Date().getFullYear() + 10
    )

    const looksLikeMonth =
      monthNameHits >= 6 ||
      hasMonthSequence ||
      matchesAny(labelText, ["month", "mm"]) ||
      matchesAny(name, ["month"]) ||
      matchesAny(id, ["month"])
    const looksLikeDay =
      hasDaySequence ||
      matchesAny(labelText, ["day", "dd"]) ||
      matchesAny(name, ["day"]) ||
      matchesAny(id, ["day"])
    const looksLikeYear =
      fourDigitYears.length >= 10 ||
      matchesAny(labelText, ["year", "yyyy"]) ||
      matchesAny(name, ["year"]) ||
      matchesAny(id, ["year"])

    if (!dobselect.month && looksLikeMonth) {
      dobselect.month = listbox
    } else if (!dobselect.day && looksLikeDay) {
      dobselect.day = listbox
    } else if (!dobselect.year && looksLikeYear) {
      dobselect.year = listbox
    }
  }

  // ====== DETECT INPUT FIELDS (NEW LOGIC) ======
  detectDOBInputs(dobselect, DOB_KEYWORDS)

  // Extra fallback: simple day/month/year inputs by common ids/aria-labels
  if (!dobselect.day) {
    const fallbackDay = document.querySelector<HTMLInputElement>(
      "input[name*='day'], input[id*='day'], input[aria-label='Day']"
    )
    if (fallbackDay) dobselect.day = fallbackDay
  }

  if (!dobselect.month) {
    const fallbackMonth = document.querySelector<HTMLInputElement>(
      "input[name*='month'], input[id*='month'], input[aria-label='Month']"
    )
    if (fallbackMonth) dobselect.month = fallbackMonth
  }

  if (!dobselect.year) {
    const fallbackYear = document.querySelector<HTMLInputElement>(
      "input[name*='year'], input[id*='year'], input[aria-label='Year']"
    )
    if (fallbackYear) dobselect.year = fallbackYear
  }

  return dobselect
}

export async function fillDOB(
  dobSelect: DOBselect,
  dob: string
): Promise<boolean> {
  if (!dob || !dobSelect) return false

  const [day, month, year] = dob.split("-")

  // If all three point to the same date input, set it directly
  if (
    dobSelect.day &&
    dobSelect.day === dobSelect.month &&
    dobSelect.day === dobSelect.year &&
    dobSelect.day instanceof HTMLInputElement &&
    dobSelect.day.type === "date"
  ) {
    try {
      const dateValue = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      triggerInputEvents(dobSelect.day, dateValue)
      return true
    } catch (error) {
      console.error("Error filling single date DOB field:", error)
      return false
    }
  }

  let filledSomething = false
  if (dobSelect.day && day) {
    try {
      const dayRaw = day
      const dayPadded = day.padStart(2, "0")
      if (dobSelect.day instanceof HTMLInputElement) {
        triggerInputEvents(dobSelect.day, dayPadded)
        filledSomething = true
      } else if (dobSelect.day instanceof HTMLSelectElement) {
        // Try raw then padded
        const successRaw = triggerSelectEvents(dobSelect.day, dayRaw)
        const successPadded = successRaw
          ? true
          : triggerSelectEvents(dobSelect.day, dayPadded)
        if (!successRaw && !successPadded) {
          // Fallback: attempt match by option text
          const opt = Array.from(dobSelect.day.options).find(
            (o) =>
              o.textContent?.trim() === dayRaw ||
              o.textContent?.trim() === String(parseInt(dayRaw, 10))
          )
          if (opt) {
            dobSelect.day.value = opt.value
            dobSelect.day.selectedIndex = opt.index
            dobSelect.day.dispatchEvent(new Event("change", { bubbles: true }))
            dobSelect.day.dispatchEvent(new Event("input", { bubbles: true }))
            filledSomething = true
          }
        } else {
          filledSomething = true
        }
      } else {
        if (triggerListboxSelection(dobSelect.day, dayPadded, "day")) {
          filledSomething = true
        }
      }
    } catch (error) {
      console.error("Error filling DOB day field:", error)
    }
  }

  if (dobSelect.month && month) {
    try {
      const monthRaw = month
      const monthPadded = month.padStart(2, "0")
      const monthNumeric = String(parseInt(monthRaw, 10)) // "3" for "03"

      if (dobSelect.month instanceof HTMLInputElement) {
        // Prefer padded so formats remain consistent
        triggerInputEvents(dobSelect.month, monthPadded)
        filledSomething = true
      } else if (dobSelect.month instanceof HTMLSelectElement) {
        // Try candidates in order of likelihood for Apple ID: padded, raw, numeric
        const candidates = [monthPadded, monthRaw, monthNumeric]
        let success = false
        for (const cand of candidates) {
          if (triggerSelectEvents(dobSelect.month, cand)) {
            success = true
            break
          }
        }
        if (!success) {
          // Fallback: match option text (e.g., "March", "3")
          const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
          ]
          const monthIndex = parseInt(monthNumeric, 10) - 1
          const targetNames = [
            monthNames[monthIndex],
            monthNumeric,
            monthRaw,
            monthPadded
          ].filter(Boolean)
          const opt = Array.from(dobSelect.month.options).find((o) => {
            const txt = o.textContent?.trim() || ""
            return targetNames.includes(txt)
          })
          if (opt) {
            dobSelect.month.value = opt.value
            dobSelect.month.selectedIndex = opt.index
            dobSelect.month.dispatchEvent(
              new Event("change", { bubbles: true })
            )
            dobSelect.month.dispatchEvent(new Event("input", { bubbles: true }))
            success = true
          }
        }
        if (success) filledSomething = true
      } else {
        if (
          triggerListboxSelection(dobSelect.month, monthPadded, "month") ||
          triggerListboxSelection(dobSelect.month, monthRaw, "month")
        ) {
          filledSomething = true
        }
      }
    } catch (error) {
      console.error("Error filling DOB month field:", error)
    }
  }

  if (dobSelect.year && year) {
    try {
      if (dobSelect.year instanceof HTMLInputElement) {
        triggerInputEvents(dobSelect.year, year)
      } else if (dobSelect.year instanceof HTMLSelectElement) {
        triggerSelectEvents(dobSelect.year, year)
      } else {
        triggerListboxSelection(dobSelect.year, year, "year")
      }
      filledSomething = true
    } catch (error) {
      console.error("Error filling DOB year field:", error)
    }
  }

  return filledSomething
}
