# Autofill Function Structure

This directory contains the modular autofill functionality, organized by field type:

## Files

- **`utils.ts`** - Common utilities and event handling
- **`email.ts`** - Email field detection and filling
- **`username.ts`** - Username field detection and filling
- **`password.ts`** - Password field detection and filling
- **`firstname.ts`** - First name field detection and filling
- **`lastname.ts`** - Last name field detection and filling
- **`gender.ts`** - Gender radio button detection and selection
- **`types.ts`** - TypeScript interfaces and type definitions
- **`index.ts`** - Main export file

## Usage

```typescript
import {
  detectEmailField,
  detectUsernameField,
  fillEmail,
  fillUsername
} from "./function"

// Detect fields
const emailEl = detectEmailField(inputs)
const usernameEl = detectUsernameField(inputs)

// Fill fields
await fillEmail(emailEl, "test@example.com")
await fillUsername(usernameEl, "testuser")
```

## Benefits

- **Modular**: Each field type is self-contained
- **Maintainable**: Easy to add new field types
- **Testable**: Each function can be tested independently
- **Reusable**: Functions can be used in different contexts
- **Type-safe**: Full TypeScript support
