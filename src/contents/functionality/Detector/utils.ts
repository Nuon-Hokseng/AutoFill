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
    if (label) return label.textContent || ""
  }

  const parentLabel = input.closest("label")
  if (parentLabel) return parentLabel.textContent || ""

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
    element.value = ""
    element.focus()

    setTimeout(() => {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      )?.set
      nativeSetter?.call(element, value)

      element.setAttribute("value", value)
      element.dispatchEvent(new Event("input", { bubbles: true }))
      element.dispatchEvent(new Event("change", { bubbles: true }))
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
    }, 10)
  })
}
