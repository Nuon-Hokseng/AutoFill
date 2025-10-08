import { getAssociatedLabelText } from "./utils"

type FieldName =
  | "username"
  | "email"
  | "password"
  | "firstname"
  | "lastname"
  | "gender"
  | "address"
  | "city"
  | "state"
  | "zipcode"
  | "country"
  | "phone"
  | "dob"

interface FieldDetection {
  input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  scores: Record<FieldName, number>
}

export const FIELD_KEYWORDS: Record<FieldName, string[]> = {
  gender: [
    "gender",
    "sex",
    "gender identity",
    "gender_id",
    "genderid",
    "gender type",
    "gender selection",
    "select gender",
    "your gender",
    "biological sex",
    "sex assigned at birth",
    "male female",
    "m/f",
    "mf",
    "choose gender",
    "user gender",
    "customer gender"
  ],
  username: [
    "username",
    "user name",
    "user-name",
    "user_name",
    "user",
    "login",
    "login name",
    "account",
    "account name",
    "usr",
    "user_id",
    "userid",
    "handle",
    "nickname",
    "profile name",
    "screen name"
  ],
  email: [
    "email",
    "e-mail",
    "e mail",
    "mail",
    "contact email",
    "email address",
    "emailaddress",
    "contact",
    "email id",
    "primary email",
    "work email",
    "personal email"
  ],
  password: [
    "password",
    "pass word",
    "pass",
    "pwd",
    "passwd",
    "user password",
    "account password",
    "secret",
    "pin",
    "security code"
  ],
  firstname: [
    "first name",
    "firstname",
    "given name",
    "given-name",
    "fname",
    "f name",
    "forename",
    "first",
    "user first name",
    "customer first name"
  ],
  lastname: [
    "last name",
    "lastname",
    "surname",
    "family name",
    "family-name",
    "lname",
    "l name",
    "second name",
    "last",
    "user last name",
    "customer last name"
  ],
  phone: [
    "phone",
    "phone number",
    "mobile",
    "mobile number",
    "telephone",
    "tel",
    "contact number",
    "cell",
    "cellphone",
    "contact phone",
    "whatsapp number"
  ],
  address: [
    "address",
    "street address",
    "home address",
    "billing address",
    "shipping address",
    "location",
    "residence",
    "addr",
    "address line"
  ],
  city: ["city", "town", "municipality", "locality", "village"],
  state: ["state", "province", "region", "territory", "county", "governorate"],
  zipcode: [
    "zip",
    "zip code",
    "zipcode",
    "postal code",
    "post code",
    "pin code",
    "pincode",
    "postal",
    "zip_code"
  ],
  country: ["country", "nation", "country name", "country_code", "nationality"],
  dob: [
    "dob",
    "date of birth",
    "birth date",
    "birthdate",
    "birthday",
    "bday",
    "dateofbirth"
  ]
}

function normalize(str: string | null | undefined) {
  return (str || "").toString().toLowerCase()
}

// simple fuzzy-ish scoring: exact token inclusion gives higher weight, substring gives smaller
function scoreMatch(text: string, keywords: string[]): number {
  const t = normalize(text)
  if (!t) return 0
  let score = 0
  for (const kw of keywords) {
    const k = kw.toLowerCase()
    if (t === k) {
      score += 4 // exact
    } else if (t.includes(k)) {
      score += 2 // contains
    } else {
      // token-level: split on non-word chars and check
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
  return 0
}

export function detectFields(
  inputs: (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[]
) {
  const detections: FieldDetection[] = []

  for (const input of inputs) {
    // cast to types accepted by helpers
    const castInput = input as HTMLInputElement | HTMLSelectElement
    const labelText = getAssociatedLabelText(castInput) || ""
    const placeholderText = normalize(
      (castInput as HTMLInputElement).placeholder ||
        (castInput.getAttribute && castInput.getAttribute("placeholder")) ||
        ""
    )
    const idName = (
      normalize((castInput as HTMLInputElement).id) +
      " " +
      normalize((castInput as HTMLInputElement).name) +
      " " +
      normalize(castInput.getAttribute?.("aria-label"))
    ).trim()
    const type = normalize(
      (castInput as HTMLInputElement).type ||
        castInput.getAttribute?.("type") ||
        ""
    )

    const scores: Record<FieldName, number> = {
      username: 0,
      email: 0,
      password: 0,
      firstname: 0,
      lastname: 0,
      address: 0,
      gender: 0,
      city: 0,
      state: 0,
      zipcode: 0,
      country: 0,
      phone: 0,
      dob: 0
    }

    for (const field of Object.keys(FIELD_KEYWORDS) as FieldName[]) {
      const keywords = FIELD_KEYWORDS[field]
      // weights: label strongest, placeholder medium, id/name weaker
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
    }

    detections.push({ input, scores })
  }

  // pick best per field
  const finalFields: Record<
    FieldName,
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
  > = {
    username: null,
    email: null,
    password: null,
    firstname: null,
    lastname: null,
    gender: null,
    address: undefined,
    city: undefined,
    state: undefined,
    zipcode: undefined,
    country: undefined,
    phone: undefined,
    dob: undefined
  }

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
    // only assign if we have some confidence
    finalFields[field] = bestScore > 0 ? (bestInput as any) : null
  }

  return finalFields
}
