// Common utilities for autofill functionality

// Helper: check if an element string matches any keyword
export function matchesAny(str: string | null, keywords: string[]): boolean {
  if (!str) return false
  const s = str.toLowerCase()
  return keywords.some((k) => s.includes(k))
}

// Try to get text from label associated with the input
export function getAssociatedLabelText(input: HTMLInputElement): string {
  try {
    // via for attribute
    if (input.id) {
      const lab = document.querySelector(`label[for="${input.id}"]`)
      if (lab) return lab.textContent || ""
    }
    // via parent <label>
    const parentLab = input.closest("label")
    if (parentLab) return parentLab.textContent || ""
  } catch (e) {}
  return ""
}

// Helper: get associated label element for manual class manipulation
export function getAssociatedLabel(
  input: HTMLInputElement
): HTMLLabelElement | null {
  try {
    // Method 1: via for attribute
    if (input.id) {
      const label = document.querySelector<HTMLLabelElement>(
        `label[for="${input.id}"]`
      )
      if (label) return label
    }

    // Method 2: parent label
    const parentLabel = input.closest("label") as HTMLLabelElement
    if (parentLabel) return parentLabel

    // Method 3: sibling label (common in some frameworks)
    const siblingLabel = input.parentElement?.querySelector(
      "label"
    ) as HTMLLabelElement
    if (siblingLabel) return siblingLabel
  } catch (e) {
    console.log("Error finding label:", e)
  }
  return null
}

// Helper: send synthetic events so frameworks detect changes and trigger label animations
export function triggerEvents(
  el: HTMLInputElement | HTMLTextAreaElement
): void {
  // Store original value
  const originalValue = el.value

  // Focus first to activate the field
  el.focus?.()

  // Small delay to ensure focus is registered
  setTimeout(() => {
    // Trigger multiple events to cover different frameworks

    // 1. Keyboard events (simulates typing)
    el.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Tab",
        code: "Tab",
        bubbles: true
      })
    )

    // 2. Input event (most important for modern frameworks)
    el.dispatchEvent(
      new Event("input", {
        bubbles: true,
        cancelable: true
      })
    )

    // 3. Change event (for traditional forms)
    el.dispatchEvent(
      new Event("change", {
        bubbles: true,
        cancelable: true
      })
    )

    // 4. Property change event (for React/Vue)
    el.dispatchEvent(
      new Event("propertychange", {
        bubbles: true
      })
    )

    // 5. Additional events for Material-UI and similar
    el.dispatchEvent(
      new Event("blur", {
        bubbles: true
      })
    )
    el.dispatchEvent(
      new Event("focusout", {
        bubbles: true
      })
    )

    // 6. Force re-focus to ensure label state updates
    el.focus?.()

    // 7. Trigger any custom events that might be needed
    if (el.value && el.value.length > 0) {
      el.classList.add("has-value") // Common class for filled inputs

      // Find associated label and add active class
      const label = getAssociatedLabel(el as HTMLInputElement)
      if (label) {
        label.classList.add("active", "filled", "focused")
      }
    }

    // Small delay then blur to finalize state
    setTimeout(() => {
      el.blur?.()
    }, 50)
  }, 10)
}

// Enhanced field filling with proper label animation support
export async function fillFieldWithAnimation(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string
): Promise<void> {
  return new Promise((resolve) => {
    // Clear any existing value first
    element.value = ""

    // Focus the element to activate it
    element.focus()

    // Set the value using multiple methods to ensure compatibility

    // Method 1: Direct value assignment
    element.value = value

    // Method 2: Simulate typing (for React controlled components)
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, value)
    }

    // Method 3: Use setAttribute for extra compatibility
    element.setAttribute("value", value)

    // Trigger all necessary events
    triggerEvents(element)

    // Additional label state management
    setTimeout(() => {
      const label = getAssociatedLabel(element as HTMLInputElement)
      const container = element.closest(
        ".form-group, .input-group, .field, .form-field, .input-container"
      )

      if (label) {
        // Add common "filled" state classes
        label.classList.add(
          "active",
          "filled",
          "focused",
          "shrink",
          "float",
          "has-value"
        )
      }

      if (container) {
        // Add filled state to container
        container.classList.add("filled", "has-value", "focused")
      }

      // Add filled state to element itself
      element.classList.add("filled", "has-value")
      element.setAttribute("data-filled", "true")

      resolve()
    }, 100)
  })
}
