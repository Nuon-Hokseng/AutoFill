import {
  ArrowLeft,
  Check,
  CheckCheck,
  Eye,
  EyeOff,
  Trash,
  Trash2,
  X
} from "lucide-react"
import React, { useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

const initialFormState = {
  username: "",
  firstname: "",
  lastname: "",
  gender: "2",
  dob: "",
  email: "",
  password: ""
}

export default function CustomTab({ goBack }: { goBack: () => void }) {
  const [form, setForm] = useStorage("autofillData", (v) =>
    v === undefined ? initialFormState : v
  )
  const [status, setStatus] = useState<React.ReactNode>("")
  const [showValues, setShowValues] = useState(false)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target as HTMLInputElement
    setForm({ ...form, [id]: value })
  }

  const handleSave = () => {
    const { dob, ...rest } = form
    const payload = { ...rest, dob }

    if (dob) {
      const [year, month, day] = dob.split("-")
      payload.dob = `${day}-${month}-${year}`
    }

    chrome.storage.local.set({ autofillData: payload }, () => {
      setStatus(
        <span className=" flex justify-center items-center gap-2 ">
          <CheckCheck className=" w-5 h-5 animate-pulse text-green-600" />
          <span className="text-gray-700">Saved</span>
        </span>
      )
      setTimeout(() => setStatus(""), 2000)
    })
  }

  const handleRemove = () => {
    // Check if there is any saved data
    chrome.storage.local.get("autofillData", (res) => {
      if (!res.autofillData) {
        setStatus(
          <span className="justify-center flex items-center gap-2 text-gray-700">
            <X className="w-5 h-5 animate-pulse text-red-600" />
            <span className="text-gray-700">No data detected</span>
          </span>
        )
        setTimeout(() => setStatus(""), 2000)
        return
      }

      // Remove saved data
      chrome.storage.local.remove("autofillData", () => {
        setForm(initialFormState)
        setStatus(
          <span className="justify-center flex items-center gap-2 ">
            <Trash className="w-5 h-5 animate-pulse text-green-600" />
            <span className="text-gray-700">Removed!</span>
          </span>
        )
        setTimeout(() => setStatus(""), 2000)
      })
    })
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
    <div className="w-80 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={goBack}
              className="p-1 rounded text-gray-600">
              <ArrowLeft size={16} />
            </button>
            <h1 className="text-lg font-semibold text-gray-800">
              Custom Credentials
            </h1>
          </div>
          <button
            onClick={() => setShowValues((s) => !s)}
            className="p-1 rounded text-gray-600"
            aria-label={showValues ? "Hide values" : "Show values"}>
            {showValues ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {inputFields.map(({ key, label, type }) => {
            if (type === "select") {
              return (
                <label key={key} htmlFor={key} className="block">
                  <span className="block text-sm text-gray-700 mb-1">
                    {label}
                  </span>
                  <select
                    id={key}
                    value={form?.[key] || ""}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-2 py-1">
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

            if (type === "date") {
              return (
                <label key={key} htmlFor={key} className="block">
                  <span className="block text-sm text-gray-700 mb-1">
                    {label}
                  </span>
                  <input
                    id={key}
                    type="date"
                    max="2010-01-01"
                    value={form?.[key] || ""}
                    onChange={handleInputChange as any}
                    className="w-full border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              )
            }

            // For non-select/non-date inputs, toggle masking when showValues is false
            const renderType =
              type === "date" || type === "select"
                ? type
                : showValues
                  ? type === "password"
                    ? "text"
                    : type
                  : "password"

            return (
              <label key={key} htmlFor={key} className="block">
                <span className="block text-sm text-gray-700 mb-1">
                  {label}
                </span>
                <input
                  id={key}
                  type={renderType as any}
                  placeholder={label}
                  value={form?.[key] || ""}
                  onChange={handleInputChange as any}
                  className="w-full border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
            )
          })}
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={handleRemove}
            className="p-2 bg-gray-100 rounded w-full flex items-center justify-center gap-2">
            <Trash2 className="w-4 h-4" />
            Remove
          </button>
          <button
            onClick={handleSave}
            className="p-2 bg-blue-500 text-white rounded w-full flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            Save
          </button>
        </div>

        {status && <p className="text-center mt-2">{status}</p>}
      </div>
    </div>
  )
}
