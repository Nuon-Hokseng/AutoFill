import { ArrowLeft } from "lucide-react"
import React, { useState } from "react"

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
            custom
          </button>
        </div>
      </div>
    </section>
  )
}

function CustomTab({ goBack }) {
  const inputCount = [
    "Username",
    "First Name",
    "Last Name",
    "Gender",
    "DOB",
    "Email",
    "Password"
  ]
  return (
    <section className="plasmo-p-6 plasmo-w-64 plasmo-border-2 plasmo-border-pink-500 ">
      <div>
        <button onClick={goBack} className="plasmo-flex  plasmo-text-gray-600">
          <ArrowLeft className="plasmo-mr-2" size={16} />
        </button>
        <h1 className="plasmo-text-xl plasmo-font-bold plasmo-text-center">
          Custom Section
        </h1>
        <div
          id="customInputs"
          className="plasmo-flex plasmo-flex-col plasmo-items-center plasmo-gap-2">
          {inputCount.map((label, idx) => {
            const id = `custom-${idx}-${label.replace(/\s+/g, "-").toLowerCase()}`
            return (
              <label
                key={id}
                htmlFor={id}
                className="plasmo-w-full plasmo-max-w-xs">
                <span className="plasmo-block plasmo-text-sm plasmo-text-gray-500 plasmo-mb-1">
                  {label}
                </span>
                <input
                  id={id}
                  type={
                    label.toLowerCase().includes("password")
                      ? "password"
                      : "text"
                  }
                  placeholder={label}
                  className="plasmo-w-full plasmo-border plasmo-border-gray-600 plasmo-rounded-md plasmo-px-2 plasmo-py-1 focus:plasmo-outline-none focus:plasmo-ring-2 focus:plasmo-ring-blue-500"
                />
              </label>
            )
          })}
        </div>
        <button className="plasmo-mt-4 plasmo-p-2 plasmo-w-full plasmo-px-4 plasmo-py-2 plasmo-bg-blue-500 plasmo-text-white plasmo-rounded hover:plasmo-bg-blue-600 plasmo-transition">
          Save
        </button>
      </div>
    </section>
  )
}
