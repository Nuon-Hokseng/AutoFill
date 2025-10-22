// Gender field detection and filling functionality
import { FIELD_KEYWORDS } from "../keyword"
import { getAssociatedLabelText, matchesAny } from "../utils"

const GENDER_KEYWORDS: string[] = ([] as string[]).concat(
  ...Object.values(FIELD_KEYWORDS)
)

export interface GenderRadios {
  male: HTMLInputElement | null
  female: HTMLInputElement | null
  custom: HTMLInputElement | null
}

// trigger event detection to radio input form
function triggerRadioEvents(el: HTMLInputElement): void {
  el.focus?.()
  el.dispatchEvent(new Event("click", { bubbles: true }))
  el.dispatchEvent(new Event("change", { bubbles: true }))
  el.dispatchEvent(new Event("input", { bubbles: true }))
  el.blur?.()
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
        console.log("Found male gender radio with value '2'")
      } else if (value === "1") {
        genderRadios.female = radio
        console.log("Found female gender radio with value '1'")
      } else if (value === "-1") {
        genderRadios.custom = radio
        console.log("Found custom gender radio with value '-1'")
      }
      // Fallback: text-based detection only if no numeric values found
      else if (
        !genderRadios.male &&
        (matchesAny(value, ["male", "m", "man", "Male"]) ||
          matchesAny(id, ["male", "m", "man", "Male"]) ||
          matchesAny(labelText, ["male", "m", "man", "Male"]))
      ) {
        genderRadios.male = radio
        console.log("Found male gender radio with text-based detection")
      } else if (
        !genderRadios.female &&
        (matchesAny(value, ["female", "f", "woman", "Female"]) ||
          matchesAny(id, ["female", "f", "woman", "Female"]) ||
          matchesAny(labelText, ["female", "f", "woman", "Female"]))
      ) {
        genderRadios.female = radio
        console.log("Found female gender radio with text-based detection")
      } else if (
        !genderRadios.custom &&
        (matchesAny(value, ["custom", "other", "prefer not to say"]) ||
          matchesAny(id, ["custom", "other", "prefer"]) ||
          matchesAny(labelText, ["custom", "other", "prefer not to say"]))
      ) {
        genderRadios.custom = radio
        console.log("Found custom gender radio with text-based detection")
      }
    }
  }

  return genderRadios
}

export async function fillGender(
  genderRadios: GenderRadios,
  gender: string
): Promise<boolean> {
  if (!gender || !genderRadios) return false

  const targetGender = gender
  let genderElement: HTMLInputElement | null = null
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

  if (genderElement) {
    try {
      console.log(`Filling gender field: ${genderLabel}`)
      genderElement.checked = true
      triggerRadioEvents(genderElement)
      return true
    } catch (error) {
      console.error("Error filling gender field:", error)
      return false
    }
  } else {
    console.warn(
      `Gender option '${targetGender}' not found in available radio buttons`
    )
    console.log("Available options:", {
      male: genderRadios.male?.value || "not found",
      female: genderRadios.female?.value || "not found",
      custom: genderRadios.custom?.value || "not found"
    })
    return false
  }
}
