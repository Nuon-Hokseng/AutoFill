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
      <button className="plasmo-w-full plasmo-px-4 plasmo-py-2 plasmo-bg-blue-500 plasmo-text-white plasmo-rounded hover:plasmo-bg-blue-600 plasmo-transition">
        <FillButton />
      </button>
    </div>
  )
}
