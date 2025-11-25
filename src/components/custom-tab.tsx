import {
  ArrowLeft,
  Check,
  CheckCheck,
  Eye,
  EyeOff,
  Settings2,
  Trash,
  Trash2,
  X
} from "lucide-react"
import { useEffect, useState } from "react"

// Use background messaging to clear AI cache to ensure background memory is reset

import React = require("react")

const initialFormState = {
  // Basic Info
  title: "",
  firstname: "",
  middlename: "",
  middleinitial: "",
  lastname: "",
  fullname: "",

  // Account
  username: "",
  email: "",
  password: "",
  userid: "",

  // Personal
  gender: "",
  dob: "",
  age: "",
  birthplace: "",
  ssn: "",
  driverslicense: "",

  // Company
  company: "",
  position: "",

  // Address
  address1: "",
  address2: "",
  city: "",
  state: "",
  zipcode: "",
  postalcode: "",
  country: "",

  // Contact
  homephone: "",
  workphone: "",
  cellphone: "",
  fax: "",
  website: "",

  // Payment
  creditcardtype: "",
  creditcardnumber: "",
  cardverificationcode: "",
  cardexpiration: "",
  cardusername: "",
  cardissuingbank: "",
  cardcustomerservicephone: "",

  // Other
  income: "",
  custommessage: "",
  comments: ""
}

export default function CustomTab({
  goBack,
  mode = "extension"
}: {
  goBack: () => void
  mode?: "extension" | "web"
}) {
  // Local state for manual input only
  // Local state for display with DOB conversion
  const [form, setForm] = useState(initialFormState)
  const [status, setStatus] = useState<React.ReactNode>("")
  const [showFieldSelector, setShowFieldSelector] = useState(false)

  // Track visibility for each sensitive field individually
  const [fieldVisibility, setFieldVisibility] = useState<
    Record<string, boolean>
  >({})

  // Field selection state - default to most common fields
  const [enabledFields, setEnabledFields] = useState<Set<string>>(
    new Set(["firstname", "lastname", "username", "email", "password"])
  )

  // Layout mode for web UI: single | two-column | card
  const [layoutMode, setLayoutMode] = useState<
    "single" | "two-column" | "card"
  >("two-column")

  // Define which fields are sensitive and should have eye toggle
  const sensitiveFields = new Set([
    "password",
    "ssn",
    "driverslicense",
    "creditcardnumber",
    "cardverificationcode",
    "cardexpiration",
    "cardcustomerservicephone"
  ])

  const toggleFieldVisibility = (fieldKey: string) => {
    setFieldVisibility((prev) => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }))
  }

  // Load initial data from storage
  useEffect(() => {
    chrome.storage.local.get(
      ["autofillData", "enabledFields", "customLayout"],
      (res) => {
        if (res.autofillData) {
          const displayData = { ...res.autofillData }

          // Convert DOB from DD-MM-YYYY (storage) to YYYY-MM-DD (date input) if needed
          if (displayData.dob && displayData.dob.includes("-")) {
            const parts = displayData.dob.split("-")
            if (parts.length === 3 && parts[0].length <= 2) {
              // Format is DD-MM-YYYY from storage, convert to YYYY-MM-DD for input
              const [day, month, year] = parts
              displayData.dob = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
              console.log(
                `📅 Converting DOB for display: ${res.autofillData.dob} → ${displayData.dob}`
              )
            }
            // If already YYYY-MM-DD, keep as is
          }

          setForm(displayData)
          console.log("📝 Updated display form from storage:", displayData)
        } else {
          setForm(initialFormState)
        }

        // Load enabled fields
        if (res.enabledFields && Array.isArray(res.enabledFields)) {
          setEnabledFields(new Set(res.enabledFields))
          console.log("📋 Loaded enabled fields:", res.enabledFields)
        }

        // Load custom layout preference for web
        if (
          res.customLayout &&
          (res.customLayout === "single" ||
            res.customLayout === "two-column" ||
            res.customLayout === "card")
        ) {
          setLayoutMode(res.customLayout)
          console.log("🎛️ Loaded custom layout:", res.customLayout)
        }
      }
    )

    // Subscribe to external storage changes so changes on webpages reflect here
    const listener = (changes: any, areaName: string) => {
      if (areaName !== "local") return
      if (changes.autofillData && changes.autofillData.newValue) {
        const displayData = { ...changes.autofillData.newValue }

        if (displayData.dob && displayData.dob.includes("-")) {
          const parts = displayData.dob.split("-")
          if (parts.length === 3 && parts[0].length <= 2) {
            const [day, month, year] = parts
            displayData.dob = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
          }
        }

        setForm(displayData)
      }

      if (changes.enabledFields) {
        const arr = changes.enabledFields.newValue || []
        if (Array.isArray(arr)) setEnabledFields(new Set(arr))
      }
    }

    try {
      chrome.storage.onChanged.addListener(listener)
    } catch (e) {
      // ignore in non-extension env
    }

    return () => {
      try {
        chrome.storage.onChanged.removeListener(listener)
      } catch (e) {
        // ignore
      }
    }
  }, [])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target as HTMLInputElement
    // Update local state only - no auto-save
    setForm({ ...form, [id]: value })
  }

  const handleSave = () => {
    const { dob, ...rest } = form
    const payload = { ...rest, dob }

    // Convert DOB from YYYY-MM-DD (HTML date input) to DD-MM-YYYY for autofill
    if (dob && dob.includes("-")) {
      const parts = dob.split("-")
      if (parts.length === 3 && parts[0].length === 4) {
        // Format is YYYY-MM-DD from date input
        const [year, month, day] = parts
        payload.dob = `${day}-${month}-${year}`
        console.log(`📅 Converting DOB for save: ${dob} → ${payload.dob}`)
      } else {
        // Already in DD-MM-YYYY format
        payload.dob = dob
      }
    }

    // Save to storage along with enabled fields
    // If we're the main webpage UI, persist enabledFields as ALL available fields
    const allFieldKeys = Object.values(inputFieldGroups)
      .flat()
      .map((f: any) => f.key)

    const enabledToSave =
      mode === "web" ? allFieldKeys : Array.from(enabledFields)

    chrome.storage.local.set(
      {
        autofillData: payload,
        enabledFields: enabledToSave,
        customLayout: layoutMode
      },
      () => {
        console.log("✅ Custom data saved successfully:", payload)
        console.log("✅ Enabled fields saved:", enabledToSave)
        setStatus(
          <span className=" flex justify-center items-center gap-2 ">
            <CheckCheck className=" w-5 h-5 animate-pulse text-green-600" />
            <span className="text-gray-700">Saved</span>
          </span>
        )
        setTimeout(() => setStatus(""), 2000)
      }
    )
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

      // Remove saved data and enabled fields
      chrome.storage.local.remove(["autofillData", "enabledFields"], () => {
        setForm(initialFormState)
        setEnabledFields(
          new Set(["firstname", "lastname", "username", "email", "password"])
        )
        console.log("🗑️ Custom data removed successfully")
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

  const toggleField = (fieldKey: string) => {
    // In `web` mode (main webpage) users cannot toggle which fields are enabled here
    if (mode === "web") return

    const newSet = new Set(enabledFields)
    if (newSet.has(fieldKey)) {
      newSet.delete(fieldKey)
    } else {
      newSet.add(fieldKey)
    }
    setEnabledFields(newSet)
    try {
      // Persist immediately so injected UI and other pages stay in sync
      chrome.storage.local.set({ enabledFields: Array.from(newSet) })
    } catch (e) {
      // ignore when not available
    }
  }

  const inputFieldGroups = {
    "Basic Info": [
      {
        key: "title",
        label: "Title",
        type: "select",
        options: ["", "Mr", "Mrs", "Ms", "Dr", "Prof"]
      },
      { key: "firstname", label: "First Name", type: "text" },
      { key: "middlename", label: "Middle Name", type: "text" },
      { key: "middleinitial", label: "Middle Initial", type: "text" },
      { key: "lastname", label: "Last Name", type: "text" },
      { key: "fullname", label: "Full Name", type: "text" }
    ],
    Account: [
      { key: "username", label: "Username", type: "text" },
      { key: "email", label: "Email", type: "email" },
      { key: "password", label: "Password", type: "password" },
      { key: "userid", label: "User ID", type: "text" }
    ],
    Personal: [
      {
        key: "gender",
        label: "Gender",
        type: "select",
        options: ["", "1", "2", "-1"]
      },
      { key: "dob", label: "Date of Birth", type: "date" },
      { key: "age", label: "Age", type: "text" },
      { key: "birthplace", label: "Birth Place", type: "text" },
      { key: "ssn", label: "SSN", type: "text" },
      { key: "driverslicense", label: "Driver License", type: "text" }
    ],
    Company: [
      { key: "company", label: "Company", type: "text" },
      { key: "position", label: "Position", type: "text" }
    ],
    Address: [
      { key: "address1", label: "Address Line 1", type: "text" },
      { key: "address2", label: "Address Line 2", type: "text" },
      { key: "city", label: "City", type: "text" },
      { key: "state", label: "State/Province", type: "text" },
      { key: "zipcode", label: "Zip Code", type: "text" },
      { key: "postalcode", label: "Postal Code", type: "text" },
      { key: "country", label: "Country", type: "text" }
    ],
    Contact: [
      { key: "homephone", label: "Home Phone", type: "tel" },
      { key: "workphone", label: "Work Phone", type: "tel" },
      { key: "cellphone", label: "Cell Phone", type: "tel" },
      { key: "fax", label: "Fax", type: "tel" },
      { key: "website", label: "Website", type: "url" }
    ],
    Payment: [
      {
        key: "creditcardtype",
        label: "Card Type",
        type: "select",
        options: ["", "Visa", "Mastercard", "Amex", "Discover"]
      },
      { key: "creditcardnumber", label: "Card Number", type: "text" },
      { key: "cardverificationcode", label: "CVV", type: "text" },
      { key: "cardexpiration", label: "Expiration (MM/YY)", type: "text" },
      { key: "cardusername", label: "Name on Card", type: "text" },
      { key: "cardissuingbank", label: "Issuing Bank", type: "text" },
      {
        key: "cardcustomerservicephone",
        label: "Customer Service",
        type: "tel"
      }
    ],
    Other: [
      { key: "income", label: "Income", type: "text" },
      { key: "custommessage", label: "Custom Message", type: "text" },
      { key: "comments", label: "Comments", type: "text" }
    ]
  }

  const containerClass =
    mode === "web"
      ? "w-full max-w-3xl bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow-2xl border border-indigo-100 overflow-hidden"
      : "w-80 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden"

  const innerP = mode === "web" ? "p-6 space-y-5" : "p-4 space-y-4"

  return (
    <div className={containerClass}>
      <div className={innerP}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button onClick={goBack} className="p-1 rounded text-indigo-600">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-indigo-800">
                Website Custom Fields
              </h1>
              <p className="text-xs text-indigo-600">
                Primary storage for autofill
              </p>
            </div>
          </div>
          {mode === "extension" && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowFieldSelector((s) => !s)}
                className="p-1 rounded text-gray-600 hover:bg-gray-100"
                aria-label="Select fields">
                <Settings2 size={16} />
              </button>
            </div>
          )}
        </div>

        {showFieldSelector && mode !== "web" && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">
                Select Fields to Enable
              </h3>
              <button
                onClick={() => setShowFieldSelector(false)}
                className="text-gray-600 hover:text-gray-800">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {Object.entries(inputFieldGroups).map(([groupName, fields]) => (
                <div key={groupName} className="space-y-1">
                  <h4 className="text-xs font-semibold text-gray-600 uppercase">
                    {groupName}
                  </h4>
                  <div className="grid grid-cols-2 gap-1">
                    {fields.map(({ key, label }: any) => (
                      <label
                        key={key}
                        className="flex items-center gap-1 text-xs cursor-pointer p-1 rounded hover:bg-blue-100">
                        <input
                          type="checkbox"
                          checked={enabledFields.has(key)}
                          onChange={() => toggleField(key)}
                          className="w-3 h-3"
                        />
                        <span className="text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {Object.entries(inputFieldGroups).map(([groupName, fields]) => {
            const enabledInGroup =
              mode === "web"
                ? fields
                : fields.filter(({ key }: any) => enabledFields.has(key))
            if (enabledInGroup.length === 0) return null

            // Card layout: responsive card grid
            const groupLayoutClass =
              "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"

            return (
              <div key={groupName} className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide pt-2 border-t border-gray-200">
                  {groupName}
                </h3>
                <div className={groupLayoutClass}>
                  {fields.map(({ key, label, type, options }: any) => {
                    const isEnabled =
                      mode === "web" ? true : enabledFields.has(key)
                    if (!isEnabled) return null

                    const cellWrapper =
                      layoutMode === "card"
                        ? "p-3 bg-white rounded-md shadow-sm border"
                        : ""

                    if (type === "select") {
                      return (
                        <div key={key} className={cellWrapper}>
                          <label htmlFor={key} className="block">
                            <span className="block text-xs text-gray-700 mb-1">
                              {label}
                            </span>
                            <select
                              id={key}
                              value={form?.[key] || ""}
                              onChange={handleInputChange}
                              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm">
                              {options ? (
                                options.map((opt: string) => (
                                  <option key={opt} value={opt}>
                                    {opt === ""
                                      ? "Select..."
                                      : key === "gender"
                                        ? opt === "1"
                                          ? "Female"
                                          : opt === "2"
                                            ? "Male"
                                            : opt === "-1"
                                              ? "Custom"
                                              : opt
                                        : opt}
                                  </option>
                                ))
                              ) : (
                                <>
                                  <option value="" disabled>
                                    Select...
                                  </option>
                                  <option value="1">Female</option>
                                  <option value="2">Male</option>
                                  <option value="-1">Custom</option>
                                </>
                              )}
                            </select>
                          </label>
                        </div>
                      )
                    }

                    if (type === "date") {
                      return (
                        <div key={key} className={cellWrapper}>
                          <label htmlFor={key} className="block">
                            <span className="block text-xs text-gray-700 mb-1">
                              {label}
                            </span>
                            <input
                              id={key}
                              type="date"
                              max="2010-01-01"
                              value={form?.[key] || ""}
                              onChange={handleInputChange as any}
                              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </label>
                        </div>
                      )
                    }

                    // For sensitive fields, show/hide based on field-specific visibility
                    const isSensitive = sensitiveFields.has(key)
                    const isVisible = fieldVisibility[key]
                    const renderType = isSensitive
                      ? isVisible
                        ? "text"
                        : "password"
                      : type

                    return (
                      <div key={key} className={`${cellWrapper} relative`}>
                        <span className="block text-xs text-gray-700 mb-1">
                          {label}
                        </span>
                        <div className="relative">
                          <input
                            id={key}
                            type={renderType as any}
                            placeholder={label}
                            value={form?.[key] || ""}
                            onChange={handleInputChange as any}
                            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                          />
                          {isSensitive && (
                            <button
                              type="button"
                              onClick={() => toggleFieldVisibility(key)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              aria-label={isVisible ? "Hide" : "Show"}>
                              {isVisible ? (
                                <EyeOff size={14} />
                              ) : (
                                <Eye size={14} />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
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
