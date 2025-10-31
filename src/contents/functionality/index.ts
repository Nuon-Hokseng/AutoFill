// Main autofill functionality - orchestrates all field types
export * from "./typesControl"
export * from "./Detector/utils"
export * from "./filler/email"
export * from "./filler/username"
export * from "./filler/password"
export * from "./filler/firstname"
export * from "./filler/lastname"
export * from "./filler/gender"
export * from "./filler/dob"
// Re-export for convenience
export { detectEmailField, fillEmail } from "./filler/email"
export { detectUsernameField, fillUsername } from "./filler/username"
export { detectPasswordField, fillPassword } from "./filler/password"
export { detectFirstNameField, fillFirstName } from "./filler/firstname"
export { detectLastNameField, fillLastName } from "./filler/lastname"
export { detectGenderFields, fillGender } from "./filler/gender"
export { detectDOBFields, fillDOB } from "./filler/dob"
export {
  matchesAny,
  getAssociatedLabelText,
  getAssociatedLabel,
  triggerEvents,
  fillFieldWithAnimation
} from "./Detector/utils"
export type { Credentials, DetectedFields, GenderRadios } from "./typesControl"
