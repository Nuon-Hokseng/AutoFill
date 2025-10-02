// Shared TypeScript interfaces for autofill functionality

export interface Credentials {
  email?: string
  username?: string
  password?: string
  firstname?: string
  lastname?: string
  gender?: string
}

export interface DetectedFields {
  emailEl: HTMLInputElement | null
  usernameEl: HTMLInputElement | null
  passwordEl: HTMLInputElement | null
  firstnameEL: HTMLInputElement | null
  lastnameEL: HTMLInputElement | null
  genderRadios: GenderRadios
}

export interface GenderRadios {
  male: HTMLInputElement | null
  female: HTMLInputElement | null
  custom: HTMLInputElement | null
}
