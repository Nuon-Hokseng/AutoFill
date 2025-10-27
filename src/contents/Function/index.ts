// Main autofill functionality - orchestrates all field types
export * from "./typesControl"
export * from "./Detector/utils"
export * from "./Fill-function/email"
export * from "./Fill-function/username"
export * from "./Fill-function/password"
export * from "./Fill-function/firstname"
export * from "./Fill-function/lastname"
export * from "./Fill-function/gender"
export * from "./Fill-function/dob"
// Re-export for convenience
export { detectEmailField, fillEmail } from "./Fill-function/email"
export { detectUsernameField, fillUsername } from "./Fill-function/username"
export { detectPasswordField, fillPassword } from "./Fill-function/password"
export { detectFirstNameField, fillFirstName } from "./Fill-function/firstname"
export { detectLastNameField, fillLastName } from "./Fill-function/lastname"
export { detectGenderFields, fillGender } from "./Fill-function/gender"
export { detectDOBFields, fillDOB } from "./Fill-function/dob"
export {
  matchesAny,
  getAssociatedLabelText,
  getAssociatedLabel,
  triggerEvents,
  fillFieldWithAnimation
} from "./Detector/utils"
export type { Credentials, DetectedFields, GenderRadios } from "./typesControl"
