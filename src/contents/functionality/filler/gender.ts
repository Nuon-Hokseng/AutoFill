// Gender field detection and filling functionality
import { FIELD_KEYWORDS } from "../Detector/keyword"
import { getAssociatedLabelText, matchesAny } from "../Detector/utils"

const GENDER_KEYWORDS: string[] = ([] as string[]).concat(
  ...Object.values(FIELD_KEYWORDS)
)

type GenderField = HTMLInputElement | HTMLElement

export interface GenderRadios {
  male: GenderField | null
  female: GenderField | null
  custom: GenderField | null
}

// trigger event detection to radio input form
function triggerRadioEvents(el: HTMLInputElement): void {
  el.focus?.()
  el.dispatchEvent(new Event("click", { bubbles: true }))
  el.dispatchEvent(new Event("change", { bubbles: true }))
  el.dispatchEvent(new Event("input", { bubbles: true }))
  el.blur?.()
}

function triggerListboxSelection(el: HTMLElement, value: string): boolean {
  const openCandidates: HTMLElement[] = []
  openCandidates.push(el)
  const toggle = el.querySelector<HTMLElement>("[aria-haspopup='listbox']")
  if (toggle) openCandidates.push(toggle)

  openCandidates.forEach((n) => n.click?.())

  const options = Array.from(
    el.querySelectorAll<HTMLElement>("[role='option'], li, [data-value]")
  )

  const candidates = [value.toLowerCase(), value.trim().toLowerCase()]

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

export function detectGenderFields(): GenderRadios {
  const genderRadios: GenderRadios = { male: null, female: null, custom: null }

  // Gender radio button detection
  const radioInputs = Array.from(
    document.querySelectorAll<HTMLInputElement>('input[type="radio"]')
  )

  for (const radio of radioInputs) {
    const name = radio.getAttribute("name") || ""
    const value = (radio.getAttribute("value") || "").toLowerCase()
    const id = (radio.getAttribute("id") || "").toLowerCase()
    const labelText = getAssociatedLabelText(radio).toLowerCase()

    // Check if this radio group is for gender
    const isGenderField =
      matchesAny(name, GENDER_KEYWORDS) ||
      matchesAny(id, GENDER_KEYWORDS) ||
      matchesAny(labelText, GENDER_KEYWORDS)

    if (isGenderField) {
      // Priority check: Use numeric values first (most reliable)
      if (value === "2") {
        genderRadios.male = radio
      } else if (value === "1") {
        genderRadios.female = radio
      } else if (value === "-1") {
        genderRadios.custom = radio
      }
      // Fallback: text-based detection only if no numeric values found
      else if (
        !genderRadios.male &&
        (matchesAny(value, ["male", "m", "man", "Male"]) ||
          matchesAny(id, ["male", "m", "man", "Male"]) ||
          matchesAny(labelText, ["male", "m", "man", "Male"]))
      ) {
        genderRadios.male = radio
      } else if (
        !genderRadios.female &&
        (matchesAny(value, ["female", "f", "woman", "Female"]) ||
          matchesAny(id, ["female", "f", "woman", "Female"]) ||
          matchesAny(labelText, ["female", "f", "woman", "Female"]))
      ) {
        genderRadios.female = radio
      } else if (
        !genderRadios.custom &&
        (matchesAny(value, ["custom", "other", "prefer not to say"]) ||
          matchesAny(id, ["custom", "other", "prefer"]) ||
          matchesAny(labelText, ["custom", "other", "prefer not to say"]))
      ) {
        genderRadios.custom = radio
      }
    }
  }

  // Detect custom listbox/select-style gender pickers
  const listboxes = Array.from(
    document.querySelectorAll<HTMLElement>("[role='listbox'], select")
  )
  for (const box of listboxes) {
    const name = box.getAttribute("name") || ""
    const id = box.getAttribute("id") || ""
    const ariaLabel = box.getAttribute("aria-label") || ""
    const dataLabel = box.getAttribute("data-label") || ""
    const labelText = [ariaLabel, dataLabel].filter(Boolean).join(" ")

    const optionTexts = Array.from(
      box.querySelectorAll<HTMLElement>("[role='option'], option, li")
    ).map((o) =>
      (o.textContent || o.getAttribute("data-value") || "").trim().toLowerCase()
    )

    const isGenderField =
      matchesAny(name, GENDER_KEYWORDS) ||
      matchesAny(id, GENDER_KEYWORDS) ||
      matchesAny(labelText, GENDER_KEYWORDS)

    if (!isGenderField) continue

    const hasMale = optionTexts.some((t) => ["male", "m", "2", "1"].includes(t))
    const hasFemale = optionTexts.some((t) =>
      ["female", "f", "1", "2"].includes(t)
    )
    const hasCustom = optionTexts.some((t) =>
      ["custom", "other", "prefer"].some((k) => t.includes(k))
    )

    if (!genderRadios.male && hasMale) genderRadios.male = box
    if (!genderRadios.female && hasFemale) genderRadios.female = box
    if (!genderRadios.custom && hasCustom) genderRadios.custom = box
  }

  return genderRadios
}

export async function fillGender(
  genderRadios: GenderRadios,
  gender: string
): Promise<boolean> {
  if (!gender || !genderRadios) return false

  const targetGender = gender
  let genderElement: GenderField | null = null
  let genderLabel = ""

  // Use numeric values for precise selection
  if (targetGender === "2" && genderRadios.male) {
    genderElement = genderRadios.male
    genderLabel = "male (value: 2)"
  } else if (targetGender === "1" && genderRadios.female) {
    genderElement = genderRadios.female
    genderLabel = "female (value: 1)"
  } else if (targetGender === "-1" && genderRadios.custom) {
    genderElement = genderRadios.custom
    genderLabel = "custom (value: -1)"
  }
  // Fallback for text-based selection
  else if (targetGender.toLowerCase() === "male" && genderRadios.male) {
    genderElement = genderRadios.male
    genderLabel = "male (text-based)"
  } else if (targetGender.toLowerCase() === "female" && genderRadios.female) {
    genderElement = genderRadios.female
    genderLabel = "female (text-based)"
  } else if (
    (targetGender.toLowerCase() === "custom" ||
      targetGender.toLowerCase() === "other") &&
    genderRadios.custom
  ) {
    genderElement = genderRadios.custom
    genderLabel = "custom (text-based)"
  }

  if (!genderElement) return false

  try {
    if (genderElement instanceof HTMLInputElement) {
      genderElement.checked = true
      triggerRadioEvents(genderElement)
      return true
    }

    // listbox/select path
    const valueToSelect = targetGender
    if (triggerListboxSelection(genderElement, valueToSelect)) return true
    // fallback to numeric ids used in sample (2 male, 1 female)
    if (
      triggerListboxSelection(
        genderElement,
        targetGender === "2"
          ? "male"
          : targetGender === "1"
            ? "female"
            : "custom"
      )
    )
      return true
  } catch (error) {
    console.error("Error filling gender field:", error)
  }

  return false
}
