export function matchesAny(str: string | null, keywords: string[]): boolean {
  if (!str) return false
  const lowerStr = str.toLowerCase()
  return keywords.some((keyword) => lowerStr.includes(keyword))
}

export function getAssociatedLabelText(
  input: HTMLInputElement | HTMLSelectElement
): string {

  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`)
    if (label) {
      const text = (label.textContent || "").trim()
      return text
    }
  }


  const parentLabel = input.closest("label")
  if (parentLabel) {
    const text = (parentLabel.textContent || "").trim()
    return text
  }

  const ariaLabelledBy = input.getAttribute("aria-labelledby")
  if (ariaLabelledBy) {
    const texts: string[] = []
    ariaLabelledBy.split(/\s+/).forEach((id) => {
      const el = document.getElementById(id)
      if (el) {
        const txt = el.textContent || el.getAttribute("aria-label") || ""
        if (txt) {
          texts.push(txt.trim())
        }
      }
    })
    if (texts.length) {
      const joined = texts.join(" ")
      return joined
    }
  }

  // 4. aria-describedby (sometimes used instead of label for hints)
  const ariaDescribedBy = input.getAttribute("aria-describedby")
  if (ariaDescribedBy) {
    const texts: string[] = []
    ariaDescribedBy.split(/\s+/).forEach((id) => {
      const el = document.getElementById(id)
      if (el) {
        const txt = el.textContent || el.getAttribute("aria-label") || ""
        if (txt) texts.push(txt.trim())
      }
    })
    if (texts.length) return texts.join(" ")
  }

  // 5. Sibling label within same container (common in custom UI libraries)
  const siblingLabel = input.parentElement?.querySelector("label")
  if (siblingLabel) return (siblingLabel.textContent || "").trim()

  return ""
}

export function getAssociatedLabel(
  input: HTMLInputElement | HTMLSelectElement
): HTMLLabelElement | null {
  if (input.id) {
    const label = document.querySelector<HTMLLabelElement>(
      `label[for="${input.id}"]`
    )
    if (label) return label
  }

  const parentLabel = input.closest("label") as HTMLLabelElement
  if (parentLabel) return parentLabel

  const siblingLabel = input.parentElement?.querySelector(
    "label"
  ) as HTMLLabelElement
  return siblingLabel || null
}

export function triggerEvents(
  element: HTMLInputElement | HTMLTextAreaElement
): void {
  element.focus()

  const events = [
    { type: "focusin", bubbles: true },
    { type: "focus", bubbles: true },
    { type: "keydown", bubbles: true, key: "Tab" },
    { type: "keyup", bubbles: true, key: "Tab" },
    { type: "input", bubbles: true, cancelable: true },
    { type: "change", bubbles: true, cancelable: true },
    { type: "propertychange", bubbles: true },
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

  setTimeout(() => {
    element.focus()
    setTimeout(() => element.blur(), 10)
  }, 5)
}

export async function fillFieldWithAnimation(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string
): Promise<void> {
  return new Promise((resolve) => {
    try {
      // Focus element first
      element.focus()
      element.click()

      // Use native setter for React/Vue compatibility
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set

      // Set the value using native setter
      if (nativeSetter) {
        nativeSetter.call(element, value)
      } else {
        element.value = value
      }

      // Trigger focus event
      element.dispatchEvent(new FocusEvent("focus", { bubbles: true }))
      element.dispatchEvent(new FocusEvent("focusin", { bubbles: true }))

      // Simulate typing with input event for each character (for strict validation)
      const inputEvent = new InputEvent("input", {
        bubbles: true,
        composed: true,
        cancelable: true,
        data: value,
        inputType: "insertText"
      })
      element.dispatchEvent(inputEvent)

      // Trigger change event
      const changeEvent = new Event("change", { bubbles: true, composed: true })
      element.dispatchEvent(changeEvent)

      // Trigger keyboard events
      element.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "Enter" })
      )
      element.dispatchEvent(
        new KeyboardEvent("keyup", { bubbles: true, key: "Enter" })
      )

      element.dispatchEvent(new Event("blur", { bubbles: true }))
      triggerEvents(element)

      const label = getAssociatedLabel(element as HTMLInputElement)

      if (label) {
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
        label.classList.add(...labelClasses)
      }

      element.classList.add("filled", "has-value", "not-empty")
      element.setAttribute("data-filled", "true")

      const container = element.closest(
        ".form-group, .input-group, .field, .form-field, .input-container, .mat-form-field, .v-input"
      )
      if (container) {
        container.classList.add("filled", "has-value", "focused")
      }

      resolve()
    } catch (error) {
      console.error(
        `❌ Error filling field "${(element as HTMLInputElement).name}":`,
        error instanceof Error ? error.message : String(error)
      )
      resolve()
    }
  })
}
