import { ArrowLeft } from "lucide-react"
import React, { useState } from "react"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

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

const initialFormState = {
  username: "",
  firstname: "",
  lastname: "",
  gender: "2",
  dob: "",
  email: "",
  password: ""
}

function CustomTab({ goBack }) {
  const [form, setForm] = useStorage("autofillData", (v) =>
    v === undefined ? initialFormState : v
  )
  const [status, setStatus] = useState("")

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setForm({ ...form, [id]: value })
  }

  const handleSave = () => {
    const { dob, ...rest } = form
    const payload = { ...rest, dob }

    if (dob) {
      const [year, month, day] = dob.split("-")
      payload.day = day
      payload.month = month
      payload.year = year
    }

    setForm(payload)
    setStatus("✅ Saved!")
    setTimeout(() => setStatus(""), 2000)
  }

  const handleRemove = () => {
    setForm(initialFormState)
    setStatus("🗑️ Removed!")
    setTimeout(() => setStatus(""), 2000)
  }

  const inputFields = [
    { key: "username", label: "Username", type: "text" },
    { key: "firstname", label: "First Name", type: "text" },
    { key: "lastname", label: "Last Name", type: "text" },
    { key: "gender", label: "Gender", type: "select" },
    { key: "dob", label: "DOB", type: "date" },
    { key: "email", label: "Email", type: "email" },
    { key: "password", label: "Password", type: "password" }
  ]

  return (
    <div className="plasmo-p-6 plasmo-w-64 plasmo-border-2 plasmo-border-pink-500">
      <button onClick={goBack} className="plasmo-flex plasmo-text-gray-600">
        <ArrowLeft className="plasmo-mr-2" size={16} />
      </button>
      <h1 className="plasmo-text-xl plasmo-font-bold plasmo-text-center">
        Custom Credentials
      </h1>
      <div className="plasmo-flex plasmo-flex-col plasmo-items-center plasmo-gap-2">
        {inputFields.map(({ key, label, type }) => {
          if (type === "select") {
            return (
              <label
                key={key}
                htmlFor={key}
                className="plasmo-w-full plasmo-max-w-xs">
                <span className="plasmo-block plasmo-text-sm plasmo-text-gray-500 plasmo-mb-1">
                  {label}
                </span>
                <select
                  id={key}
                  value={form?.[key] || ""}
                  onChange={handleInputChange}
                  className="plasmo-w-full plasmo-border plasmo-border-gray-600 plasmo-rounded-md plasmo-px-2 plasmo-py-1">
                  <option value="" disabled>
                    Select...
                  </option>
                  <option value="1">Female</option>
                  <option value="2">Male</option>
                  <option value="-1">Custom</option>
                </select>
              </label>
            )
          }

          return (
            <label
              key={key}
              htmlFor={key}
              className="plasmo-w-full plasmo-max-w-xs">
              <span className="plasmo-block plasmo-text-sm plasmo-text-gray-500 plasmo-mb-1">
                {label}
              </span>
              <input
                id={key}
                type={type}
                placeholder={label}
                value={form?.[key] || ""}
                onChange={handleInputChange}
                className="plasmo-w-full plasmo-border plasmo-border-gray-600 plasmo-rounded-md plasmo-px-2 plasmo-py-1 focus:plasmo-outline-none focus:plasmo-ring-2 focus:plasmo-ring-blue-500"
              />
            </label>
          )
        })}
      </div>
      <div className="plasmo-flex plasmo-gap-2 plasmo-mt-4">
        <button
          onClick={handleRemove}
          className="plasmo-p-2 plasmo-bg-gray-300 plasmo-rounded plasmo-w-full">
          Remove
        </button>
        <button
          onClick={handleSave}
          className="plasmo-p-2 plasmo-bg-blue-500 plasmo-text-white plasmo-rounded plasmo-w-full">
          Save
        </button>
      </div>
      {status && <p className="plasmo-text-center plasmo-mt-2">{status}</p>}
    </div>
  )
}
