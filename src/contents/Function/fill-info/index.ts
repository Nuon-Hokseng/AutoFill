// Main autofill functionality - orchestrates all field types
export * from "./typesControl"
export * from "./utils"
export * from "./email"
export * from "./username"
export * from "./password"
export * from "./firstname"
export * from "./lastname"
export * from "./gender"
export * from "./dob"
// Re-export for convenience
export { detectEmailField, fillEmail } from "./email"
export { detectUsernameField, fillUsername } from "./username"
export { detectPasswordField, fillPassword } from "./password"
export { detectFirstNameField, fillFirstName } from "./firstname"
export { detectLastNameField, fillLastName } from "./lastname"
export { detectGenderFields, fillGender } from "./gender"
export { detectDOBFields, fillDOB} from "./dob"
export {
  matchesAny,
  getAssociatedLabelText,
  getAssociatedLabel,
  triggerEvents,
  fillFieldWithAnimation
} from "./utils"
export type { Credentials, DetectedFields, GenderRadios } from "./typesControl"
