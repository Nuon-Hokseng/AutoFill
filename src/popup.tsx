import { FillButton } from "~features/fill-button"

import "~style.css"

export default function IndexPopup() {
  return (
    <div className="plasmo-p-6 plasmo-w-64">
      <h1 className="plasmo-text-xl plasmo-font-bold plasmo-mb-4">
        Auto Fill Extension
      </h1>
      <p className="plasmo-text-gray-600 plasmo-mb-4">
        Your extension is ready for development!
      </p>
      <FillButton />
    </div>
  )
}
