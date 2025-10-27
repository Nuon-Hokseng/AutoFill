import {
  ArrowLeft,
  Check,
  CheckCheck,
  Eye,
  EyeOff,
  Info,
  Sparkles,
  Trash,
  Trash2,
  X
} from "lucide-react"
import { useEffect, useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import React = require("react")

const initialFormState = {
  username: "",
  firstname: "",
  lastname: "",
  gender: "",
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
  const [hasAnyData, setHasAnyData] = useState(false)

  // Load data from Chrome storage when component mounts
  useEffect(() => {
    chrome.storage.local.get("autofillData", (res) => {
      if (res.autofillData) {
        console.log("📥 Loaded data from storage:", res.autofillData)
        setForm(res.autofillData)
      } else {
        console.log("📭 No data found in storage")
      }
    })

    // Listen for storage changes
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local" && changes.autofillData) {
        console.log(
          "🔄 Storage changed, reloading data:",
          changes.autofillData.newValue
        )
        if (changes.autofillData.newValue) {
          setForm(changes.autofillData.newValue)
        }
      }
    }

    chrome.storage.onChanged.addListener(handleStorageChange)

    // Cleanup listener on unmount
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange)
    }
  }, [])

  // Check if form has any data
  useEffect(() => {
    const hasData = Object.values(form || {}).some(
      (value) => value && typeof value === "string" && value.trim() !== ""
    )
    setHasAnyData(hasData)
  }, [form])

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
        <span className=" plasmo-flex plasmo-justify-center plasmo-items-center plasmo-gap-2 ">
          <CheckCheck className=" plasmo-w-5 plasmo-h-5 plasmo-animate-pulse plasmo-text-green-600" />
          <span className="plasmo-text-gray-700">Saved</span>
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
          <span className="plasmo-justify-center plasmo-flex plasmo-items-center plasmo-gap-2 plasmo-text-gray-700">
            <X className="plasmo-w-5 plasmo-h-5 plasmo-animate-pulse plasmo-text-red-600" />
            <span className="plasmo-text-gray-700">No data detected</span>
          </span>
        )
        setTimeout(() => setStatus(""), 2000)
        return
      }

      // Remove saved data
      chrome.storage.local.remove("autofillData", () => {
        setForm(initialFormState)
        setStatus(
          <span className="plasmo-justify-center plasmo-flex plasmo-items-center plasmo-gap-2 ">
            <Trash className="plasmo-w-5 plasmo-h-5 plasmo-animate-pulse plasmo-text-green-600" />
            <span className="plasmo-text-gray-700">Removed!</span>
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
    <div className="plasmo-w-80 plasmo-bg-white plasmo-rounded-lg plasmo-shadow-2xl plasmo-border plasmo-border-gray-200 plasmo-overflow-hidden">
      <div className="plasmo-p-4 plasmo-space-y-4">
        <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-gap-2">
          <div className="plasmo-flex plasmo-items-center plasmo-gap-2">
            <button
              onClick={goBack}
              className="plasmo-p-1 plasmo-rounded plasmo-text-gray-600">
              <ArrowLeft size={16} />
            </button>
            <h1 className="plasmo-text-lg plasmo-font-semibold plasmo-text-gray-800">
              Custom Credentials
            </h1>
          </div>
          <button
            onClick={() => setShowValues((s) => !s)}
            className="plasmo-p-1 plasmo-rounded plasmo-text-gray-600"
            aria-label={showValues ? "Hide values" : "Show values"}>
            {showValues ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {!hasAnyData && (
          <div className="plasmo-bg-blue-50 plasmo-border plasmo-border-blue-200 plasmo-rounded-lg plasmo-p-3 plasmo-flex plasmo-items-start plasmo-gap-2">
            <Sparkles className="plasmo-w-5 plasmo-h-5 plasmo-text-blue-600 plasmo-flex-shrink-0 plasmo-mt-0.5" />
            <div className="plasmo-text-sm plasmo-text-blue-800">
              <p className="plasmo-font-medium plasmo-mb-1">
                AI-Generated Data Active
              </p>
              <p className="plasmo-text-blue-700">
                Since no custom data is saved, we'll use AI-generated dummy data
                for autofill.
              </p>
            </div>
          </div>
        )}

        {hasAnyData && (
          <div className="plasmo-bg-green-50 plasmo-border plasmo-border-green-200 plasmo-rounded-lg plasmo-p-3 plasmo-flex plasmo-items-start plasmo-gap-2">
            <Info className="plasmo-w-5 plasmo-h-5 plasmo-text-green-600 plasmo-flex-shrink-0 plasmo-mt-0.5" />
            <div className="plasmo-text-sm plasmo-text-green-800">
              <p className="plasmo-font-medium plasmo-mb-1">
                Saved Credentials
              </p>
              <p className="plasmo-text-green-700">
                These credentials will be used for autofill. You can edit or
                remove them anytime.
              </p>
            </div>
          </div>
        )}

        <div className="plasmo-space-y-3 plasmo-max-h-80 plasmo-overflow-y-auto">
          {inputFields.map(({ key, label, type }) => {
            if (type === "select") {
              return (
                <label key={key} htmlFor={key} className="plasmo-block">
                  <span className="plasmo-block plasmo-text-sm plasmo-text-gray-700 plasmo-mb-1">
                    {label}
                  </span>
                  <select
                    id={key}
                    value={form?.[key] || ""}
                    onChange={handleInputChange}
                    className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-md plasmo-px-2 plasmo-py-1">
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
                <label key={key} htmlFor={key} className="plasmo-block">
                  <span className="plasmo-block plasmo-text-sm plasmo-text-gray-700 plasmo-mb-1">
                    {label}
                  </span>
                  <input
                    id={key}
                    type="date"
                    max="2010-01-01"
                    value={form?.[key] || ""}
                    onChange={handleInputChange as any}
                    className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-md plasmo-px-2 plasmo-py-1 plasmo-focus:outline-none plasmo-focus:ring-2 plasmo-focus:ring-blue-500"
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
              <label key={key} htmlFor={key} className="plasmo-block">
                <span className="plasmo-block plasmo-text-sm plasmo-text-gray-700 plasmo-mb-1">
                  {label}
                </span>
                <input
                  id={key}
                  type={renderType as any}
                  placeholder={label}
                  value={form?.[key] || ""}
                  onChange={handleInputChange as any}
                  className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-md plasmo-px-2 plasmo-py-1 plasmo-focus:outline-none plasmo-focus:ring-2 plasmo-focus:ring-blue-500"
                />
              </label>
            )
          })}
        </div>

        <div className="plasmo-flex plasmo-gap-2 plasmo-mt-2">
          <button
            onClick={handleRemove}
            className="plasmo-p-2 plasmo-bg-gray-100 plasmo-rounded plasmo-w-full plasmo-flex plasmo-items-center plasmo-justify-center plasmo-gap-2">
            <Trash2 className="plasmo-w-4 plasmo-h-4" />
            Remove
          </button>
          <button
            onClick={handleSave}
            className="plasmo-p-2 plasmo-bg-blue-500 plasmo-text-white plasmo-rounded plasmo-w-full plasmo-flex plasmo-items-center plasmo-justify-center plasmo-gap-2">
            <Check className="plasmo-w-4 plasmo-h-4" />
            Save
          </button>
        </div>

        {status && <p className="plasmo-text-center plasmo-mt-2">{status}</p>}
      </div>
    </div>
  )
}
