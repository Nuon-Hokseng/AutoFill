// Main autofill functionality - orchestrates all field types
import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true,
  run_at: "document_end"
}
export * from "./typesControl"
export * from "./Detector/utils"
export * from "./filler/email"
export * from "./filler/username"
export * from "./filler/password"
export * from "./filler/firstname"
export * from "./filler/lastname"
export * from "./filler/gender"
export * from "./filler/dob"
export * from "./filler/moreFields"

// Re-export for convenience
export { detectEmailField, fillEmail } from "./filler/email"
export { detectUsernameField, fillUsername } from "./filler/username"
export { detectPasswordField, fillPassword } from "./filler/password"
export { detectFirstNameField, fillFirstName } from "./filler/firstname"
export { detectLastNameField, fillLastName } from "./filler/lastname"
export { detectGenderFields, fillGender } from "./filler/gender"
export { detectDOBFields, fillDOB } from "./filler/dob"

// New field detectors and fillers
export {
  detectMiddleNameField,
  fillMiddleName,
  detectFullNameField,
  fillFullName,
  detectCompanyField,
  fillCompany,
  detectPositionField,
  fillPosition,
  detectAddressLine1Field,
  detectAddressLine2Field,
  fillAddressLine,
  detectHomePhoneField,
  detectCellPhoneField,
  fillPhoneField,
  detectWebsiteField,
  fillWebsite,
  detectAgeField,
  detectBirthPlaceField,
  detectCityField,
  detectStateField,
  detectZipcodeField,
  detectCountryField,
  genericFill
} from "./filler/moreFields"

export {
  matchesAny,
  getAssociatedLabelText,
  getAssociatedLabel,
  triggerEvents,
  fillFieldWithAnimation
} from "./Detector/utils"
export type { Credentials, DetectedFields, GenderRadios } from "./typesControl"
