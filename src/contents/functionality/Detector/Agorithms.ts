import { FIELD_KEYWORDS } from "./keyword"
import type { FieldName } from "./keyword"
import { getAssociatedLabelText } from "./utils"

interface FieldDetection {
  input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  scores: Record<FieldName, number>
}

function normalize(str: string | null | undefined) {
  return (str || "").toString().toLowerCase()
}

// scoring system
function scoreMatch(text: string, keywords: string[]): number {
  const t = normalize(text)
  if (!t) return 0
  let score = 0
  for (const kw of keywords) {
    const k = kw.toLowerCase()
    if (t === k) {
      score += 4
    } else if (t.includes(k)) {
      score += 2
    } else {
      // split on non-word chars and check
      const tokens = t.split(/\W+/)
      if (tokens.includes(k)) score += 3
    }
  }
  return score
}

function getAutocompleteBonus(
  el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  field: FieldName
) {
  const ac = normalize(
    (el as HTMLInputElement).getAttribute?.("autocomplete") || ""
  )
  if (!ac) return 0
  if (ac.includes(field)) return 6
  // email or username tokens
  if (field === "email" && ac.includes("email")) return 6
  if (
    field === "username" &&
    (ac.includes("username") || ac.includes("username"))
  )
    return 6
  if (field === "password" && ac.includes("current-password")) return 6
  // Map HTML autocomplete tokens to our fields
  if (
    field === "firstname" &&
    (ac.includes("given-name") || ac.includes("givenname"))
  )
    return 6
  if (
    field === "lastname" &&
    (ac.includes("family-name") || ac.includes("familyname"))
  )
    return 6
  if (field === "address1" && ac.includes("address-line1")) return 6
  if (field === "address2" && ac.includes("address-line2")) return 6
  if (field === "city" && ac.includes("address-level2")) return 6
  if (field === "state" && ac.includes("address-level1")) return 6
  if (field === "zipcode" && (ac.includes("postal-code") || ac.includes("zip")))
    return 6
  if (field === "country" && ac.includes("country")) return 6
  if (
    (field === "phone" ||
      field === "cellphone" ||
      field === "workphone" ||
      field === "homephone") &&
    (ac.includes("tel") ||
      ac.includes("tel-national") ||
      ac.includes("tel-country-code"))
  )
    return 6
  return 0
}

export function detectFields(
  inputs: (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[]
) {
  const detections: FieldDetection[] = []
  const debug = false // Set to true to see detailed scoring for Apple ID debugging

  const isVisible = (
    el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  ) => {
    const style = window.getComputedStyle(el)
    if (style.display === "none" || style.visibility === "hidden") return false
    if ((el as HTMLInputElement).type === "hidden") return false
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return false
    return true
  }

  for (const input of inputs) {
    if (!isVisible(input)) continue
    // cast to types accepted by helpers
    const castInput = input as HTMLInputElement | HTMLSelectElement
    const labelText = getAssociatedLabelText(castInput) || ""
    const placeholderText = normalize(
      (castInput as HTMLInputElement).placeholder ||
        (castInput.getAttribute && castInput.getAttribute("placeholder")) ||
        ""
    )

    // Helper to split camelCase into space-separated words
    const splitCamelCase = (str: string | null | undefined) => {
      if (!str) return ""
      return str.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()
    }

    const name = (castInput as HTMLInputElement).name || ""
    const id = (castInput as HTMLInputElement).id || ""

    const idName = (
      normalize(id) +
      " " +
      splitCamelCase(id) +
      " " +
      normalize(name) +
      " " +
      splitCamelCase(name) +
      " " +
      normalize(castInput.getAttribute?.("aria-label")) +
      " " +
      normalize(castInput.getAttribute?.("data-test")) +
      " " +
      normalize(castInput.getAttribute?.("data-testid")) +
      " " +
      normalize(castInput.getAttribute?.("data-field")) +
      " " +
      normalize(castInput.getAttribute?.("data-name"))
    ).trim()
    const type = normalize(
      (castInput as HTMLInputElement).type ||
        castInput.getAttribute?.("type") ||
        ""
    )

    // initialize scores dynamically to support any keys in FIELD_KEYWORDS
    const scores: Record<FieldName, number> = {} as Record<FieldName, number>

    for (const field of Object.keys(FIELD_KEYWORDS) as FieldName[]) {
      const keywords = FIELD_KEYWORDS[field]
      // weights: label strongest, placeholder medium, id/name & data-* weaker
      scores[field] =
        scoreMatch(labelText, keywords) * 3 +
        scoreMatch(placeholderText, keywords) * 2 +
        scoreMatch(idName, keywords) * 1 +
        getAutocompleteBonus(input, field)

      // type-based boosts
      if (field === "email" && type === "email") scores[field] += 8
      if (field === "password" && type === "password") scores[field] += 8
      if (field === "username" && (type === "text" || type === "search"))
        scores[field] += 1

      // IMPORTANT: Prevent firstname/lastname from matching username-like fields
      // If idName or placeholder contains "user" or "login", boost username and penalize firstname/lastname
      const hasUsernameIndicators =
        idName.includes("user") ||
        idName.includes("login") ||
        placeholderText.includes("user") ||
        placeholderText.includes("login") ||
        labelText.toLowerCase().includes("user") ||
        labelText.toLowerCase().includes("login")

      if (hasUsernameIndicators) {
        if (field === "username") {
          scores[field] += 5 // Boost username score
        } else if (field === "firstname" || field === "lastname") {
          scores[field] = Math.max(0, scores[field] - 8) // Strong penalty for firstname/lastname
        }
      }

      // If field explicitly has "firstname" or "lastname" in identifiers, strongly boost those fields
      const hasFirstnameIndicators =
        idName.includes("firstname") ||
        idName.includes("first-name") ||
        idName.includes("first_name") ||
        idName.includes("fname") ||
        (placeholderText.includes("first") && !placeholderText.includes("full"))

      const hasLastnameIndicators =
        idName.includes("lastname") ||
        idName.includes("last-name") ||
        idName.includes("last_name") ||
        idName.includes("lname") ||
        (placeholderText.includes("last") && !placeholderText.includes("full"))

      const hasFullnameIndicators =
        idName.includes("fullname") ||
        idName.includes("full-name") ||
        idName.includes("full_name") ||
        idName.includes("completename") ||
        idName.includes("full name") ||
        placeholderText.includes("full name") ||
        labelText.toLowerCase().includes("full name")

      if (hasFirstnameIndicators && field === "firstname") {
        scores[field] += 15 // Very strong boost for firstname
      }
      if (hasLastnameIndicators && field === "lastname") {
        scores[field] += 15 // Very strong boost for lastname
      }
      if (hasFullnameIndicators && field === "fullname") {
        scores[field] += 12 // Strong boost for fullname
      }

      // Prevent fullname from taking firstname/lastname fields (very aggressive penalties)
      if (hasFirstnameIndicators && field === "fullname") {
        scores[field] = Math.max(0, scores[field] - 20) // Kill fullname score completely
      }
      if (hasLastnameIndicators && field === "fullname") {
        scores[field] = Math.max(0, scores[field] - 20) // Kill fullname score completely
      }

      // Prevent firstname/lastname from taking fullname fields
      if (hasFullnameIndicators && field === "firstname") {
        scores[field] = Math.max(0, scores[field] - 15)
      }
      if (hasFullnameIndicators && field === "lastname") {
        scores[field] = Math.max(0, scores[field] - 15)
      }
    }

    detections.push({ input, scores })

    if (debug) {
      // Show top 3 scoring fields for this input
    }
  }

  // pick best per field
  const finalFields = {} as Record<
    FieldName,
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
  >

  for (const field of Object.keys(FIELD_KEYWORDS) as FieldName[]) {
    let bestScore = 0
    let bestInput: FieldDetection["input"] | null = null
    for (const det of detections) {
      const s = det.scores[field]
      if (s > bestScore) {
        bestScore = s
        bestInput = det.input
      }
    }
    // only assign if we have some confidence based on score
    finalFields[field] = bestScore > 0 ? (bestInput as any) : null
  }

  return finalFields
}
