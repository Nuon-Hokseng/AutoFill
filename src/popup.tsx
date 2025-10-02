import React from "react"

import { FillButton } from "~features/fill-button"

import "~style.css"

export default function IndexPopup() {
  return (
    <div className="plasmo-p-6 plasmo-w-64 plasmo-border-2 plasmo-border-pink-500">
      <h1 className="plasmo-text-xl plasmo-font-bold plasmo-mb-4 plasmo-text-center">
        Auto Fill Extension
      </h1>
      <p className="plasmo-text-gray-600 plasmo-mb-4 plasmo-text-center">
        Click this button between fields to auto fill your credentials
      </p>
      <FillButton />
      <button
        onClick={() => chrome.runtime.openOptionsPage()}
        className="plasmo-text-gray-600 plasmo-mb-4 plasmo-text-center plasmo-p-2">Setting</button>
    </div>
  )
}
