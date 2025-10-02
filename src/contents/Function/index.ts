// Main autofill functionality - orchestrates all field types
export * from "./fill-info/typesControl"
export * from "./fill-info/utils"
export * from "./fill-info/email"
export * from "./fill-info/username"
export * from "./fill-info/password"
export * from "./fill-info/firstname"
export * from "./fill-info/lastname"
export * from "./fill-info/gender"

// Re-export for convenience
export { detectEmailField, fillEmail } from "./fill-info/email"
export { detectUsernameField, fillUsername } from "./fill-info/username"
export { detectPasswordField, fillPassword } from "./fill-info/password"
export { detectFirstNameField, fillFirstName } from "./fill-info/firstname"
export { detectLastNameField, fillLastName } from "./fill-info/lastname"
export { detectGenderFields, fillGender } from "./fill-info/gender"
export {
  matchesAny,
  getAssociatedLabelText,
  getAssociatedLabel,
  triggerEvents,
  fillFieldWithAnimation
} from "./fill-info/utils"
export type { Credentials, DetectedFields, GenderRadios } from "./fill-info/typesControl"
