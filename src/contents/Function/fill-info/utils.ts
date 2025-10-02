// Simplified utilities for autofill functionality

//check if there is any keyword
export function matchesAny(str: string | null, keywords: string[]): boolean {
  if (!str) return false
  const lowerStr = str.toLowerCase()
  return keywords.some((keyword) => lowerStr.includes(keyword))
}

// get content from element input field
export function getAssociatedLabelText(input: HTMLInputElement): string {
  // Try label with 'for' attribute first
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`)
    if (label) return label.textContent || ""
  }

  // Try parent label
  const parentLabel = input.closest("label")
  if (parentLabel) return parentLabel.textContent || ""

  return ""
}

//label from input elements
export function getAssociatedLabel(
  input: HTMLInputElement
): HTMLLabelElement | null {
  // Try label with 'for' attribute first
  if (input.id) {
    const label = document.querySelector<HTMLLabelElement>(
      `label[for="${input.id}"]`
    )
    if (label) return label
  }

  // Try parent label like <span>
  const parentLabel = input.closest("label") as HTMLLabelElement
  if (parentLabel) return parentLabel

  // Try sibling label like <div> inside the <span>
  const siblingLabel = input.parentElement?.querySelector(
    "label"
  ) as HTMLLabelElement
  return siblingLabel || null
}

// notify the framework that the field has value
export function triggerEvents(
  element: HTMLInputElement | HTMLTextAreaElement
): void {
  // Focus the field first
  element.focus()

  // Comprehensive event triggering for different frameworks
  const events = [
    { type: "focusin", bubbles: true },
    { type: "focus", bubbles: true },
    { type: "keydown", bubbles: true, key: "Tab" },
    { type: "keyup", bubbles: true, key: "Tab" },
    { type: "input", bubbles: true, cancelable: true },
    { type: "change", bubbles: true, cancelable: true },
    { type: "propertychange", bubbles: true }, // IE/legacy support
    { type: "blur", bubbles: true },
    { type: "focusout", bubbles: true }
  ]

  events.forEach(({ type, bubbles, cancelable, key }) => {
    let event
    if (key) {
      event = new KeyboardEvent(type, { key, bubbles, cancelable })
    } else {
      event = new Event(type, { bubbles, cancelable })
    }
    element.dispatchEvent(event)
  })

  // Force focus back briefly to ensure state is captured
  setTimeout(() => {
    element.focus()
    setTimeout(() => element.blur(), 10)
  }, 5)
}

//animation setter for filling the form
export async function fillFieldWithAnimation(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string
): Promise<void> {
  return new Promise((resolve) => {
    // Clear existing value first
    element.value = ""
    element.focus()

    // Small delay to ensure focus is registered
    setTimeout(() => {
      // Set the value using multiple methods for maximum compatibility
      element.value = value

      // For React compatibility - set value via native setter
      const nativeSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      )?.set
      if (nativeSetter) {
        nativeSetter.call(element, value)
      }

      // Set attribute as backup
      element.setAttribute("value", value)

      // Trigger comprehensive events
      triggerEvents(element)

      // Enhanced label animation handling
      setTimeout(() => {
        const label = getAssociatedLabel(element as HTMLInputElement)

        if (label) {
          // Add all common label animation classes
          const labelClasses = [
            "active",
            "filled",
            "shrink",
            "float",
            "has-value",
            "focused",
            "not-empty",
            "dirty",
            "ng-not-empty"
          ]
        }

        // Add classes to the input element itself
        const inputClasses = [
          "filled",
          "has-value",
          "not-empty",
          "dirty",
          "ng-not-empty"
          
        ]
        element.classList.add(...inputClasses)
        element.setAttribute("data-filled", "true")

        // Also check for parent containers that might need classes
        const container = element.closest(
          ".form-group, .input-group, .field, .form-field, .input-container, .mat-form-field, .v-input"
        )
        if (container) {
          container.classList.add("filled", "has-value", "focused")
        }

        resolve()
      }, 100)
    }, 10)
  })
}
