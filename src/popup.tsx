
import React, { useState } from "react"


import CustomTab from "~features/custom-tab"
import { FillButton } from "~features/fill-button"

import "~style.css"

export default function IndexPopup() {
  const [activeCustomTab, setActiveCustomTab] = useState("home")
  if (activeCustomTab === "custom") {
    return <CustomTab goBack={() => setActiveCustomTab("home")} />
  }
  return (
    <section>
      <div className="plasmo-p-6 plasmo-w-64 plasmo-border-2 plasmo-border-pink-500 ">
        <h1 className="plasmo-text-xl plasmo-font-bold plasmo-mb-4 plasmo-text-center">
          Auto Fill Extension
        </h1>
        <p className="plasmo-text-gray-600 plasmo-mb-4 plasmo-text-center">
          Click this button between fields to auto fill your credentials
        </p>
        <FillButton />
        <div
          id="buttons"
          className="plasmo-flex plasmo-justify-between plasmo-mt-4">
          <button
            onClick={() => chrome.runtime.openOptionsPage()}
            className="plasmo-text-gray-600 plasmo-text-center plasmo-mt-1">
            Setting
          </button>
          <button
            onClick={() => setActiveCustomTab("custom")}
            className="plasmo-flex  plasmo-text-gray-600">
            Custom 
          </button>
        </div>
      </div>
    </section>
  )
}
