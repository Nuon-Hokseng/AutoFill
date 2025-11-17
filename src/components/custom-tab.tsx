import {
  ArrowLeft,
  Check,
  CheckCheck,
  Eye,
  EyeOff,
  Info,
  RefreshCw,
  Settings2,
  Sparkles,
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

export default function CustomTab({ goBack }: { goBack: () => void }) {
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
    chrome.storage.local.get(["autofillData", "enabledFields"], (res) => {
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
    })
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
    chrome.storage.local.set(
      {
        autofillData: payload,
        enabledFields: Array.from(enabledFields)
      },
      () => {
        console.log("✅ Custom data saved successfully:", payload)
        console.log("✅ Enabled fields saved:", Array.from(enabledFields))
        setStatus(
          <span className=" plasmo-flex plasmo-justify-center plasmo-items-center plasmo-gap-2 ">
            <CheckCheck className=" plasmo-w-5 plasmo-h-5 plasmo-animate-pulse plasmo-text-green-600" />
            <span className="plasmo-text-gray-700">Saved</span>
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
          <span className="plasmo-justify-center plasmo-flex plasmo-items-center plasmo-gap-2 plasmo-text-gray-700">
            <X className="plasmo-w-5 plasmo-h-5 plasmo-animate-pulse plasmo-text-red-600" />
            <span className="plasmo-text-gray-700">No data detected</span>
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
          <span className="plasmo-justify-center plasmo-flex plasmo-items-center plasmo-gap-2 ">
            <Trash className="plasmo-w-5 plasmo-h-5 plasmo-animate-pulse plasmo-text-green-600" />
            <span className="plasmo-text-gray-700">Removed!</span>
          </span>
        )
        setTimeout(() => setStatus(""), 2000)
      })
    })
  }

  const toggleField = (fieldKey: string) => {
    const newSet = new Set(enabledFields)
    if (newSet.has(fieldKey)) {
      newSet.delete(fieldKey)
    } else {
      newSet.add(fieldKey)
    }
    setEnabledFields(newSet)
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
            <h1 className="plasmo-text-sm plasmo-font-semibold plasmo-text-gray-800">
              Custom Credentials
            </h1>
          </div>
          <div className="plasmo-flex plasmo-items-center plasmo-gap-1">
            <button
              onClick={() => setShowFieldSelector((s) => !s)}
              className="plasmo-p-1 plasmo-rounded plasmo-text-gray-600 hover:plasmo-bg-gray-100"
              aria-label="Select fields">
              <Settings2 size={16} />
            </button>
          </div>
        </div>

        {showFieldSelector && (
          <div className="plasmo-p-3 plasmo-bg-blue-50 plasmo-border plasmo-border-blue-200 plasmo-rounded-lg plasmo-space-y-2">
            <div className="plasmo-flex plasmo-items-center plasmo-justify-between">
              <h3 className="plasmo-text-sm plasmo-font-semibold plasmo-text-gray-800">
                Select Fields to Enable
              </h3>
              <button
                onClick={() => setShowFieldSelector(false)}
                className="plasmo-text-gray-600 hover:plasmo-text-gray-800">
                <X size={16} />
              </button>
            </div>
            <div className="plasmo-max-h-60 plasmo-overflow-y-auto plasmo-space-y-2 plasmo-pr-2">
              {Object.entries(inputFieldGroups).map(([groupName, fields]) => (
                <div key={groupName} className="plasmo-space-y-1">
                  <h4 className="plasmo-text-xs plasmo-font-semibold plasmo-text-gray-600 plasmo-uppercase">
                    {groupName}
                  </h4>
                  <div className="plasmo-grid plasmo-grid-cols-2 plasmo-gap-1">
                    {fields.map(({ key, label }: any) => (
                      <label
                        key={key}
                        className="plasmo-flex plasmo-items-center plasmo-gap-1 plasmo-text-xs plasmo-cursor-pointer plasmo-p-1 plasmo-rounded hover:plasmo-bg-blue-100">
                        <input
                          type="checkbox"
                          checked={enabledFields.has(key)}
                          onChange={() => toggleField(key)}
                          className="plasmo-w-3 plasmo-h-3"
                        />
                        <span className="plasmo-text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="plasmo-space-y-3 plasmo-max-h-96 plasmo-overflow-y-auto plasmo-pr-2">
          {Object.entries(inputFieldGroups).map(([groupName, fields]) => {
            const enabledInGroup = fields.filter(({ key }: any) =>
              enabledFields.has(key)
            )
            if (enabledInGroup.length === 0) return null

            return (
              <div key={groupName} className="plasmo-space-y-2">
                <h3 className="plasmo-text-xs plasmo-font-semibold plasmo-text-gray-600 plasmo-uppercase plasmo-tracking-wide plasmo-pt-2 plasmo-border-t plasmo-border-gray-200">
                  {groupName}
                </h3>
                {fields.map(({ key, label, type, options }: any) => {
                  const isEnabled = enabledFields.has(key)
                  if (!isEnabled) return null

                  if (type === "select") {
                    return (
                      <label key={key} htmlFor={key} className="plasmo-block">
                        <span className="plasmo-block plasmo-text-xs plasmo-text-gray-700 plasmo-mb-1">
                          {label}
                        </span>
                        <select
                          id={key}
                          value={form?.[key] || ""}
                          onChange={handleInputChange}
                          className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-md plasmo-px-2 plasmo-py-1.5 plasmo-text-sm">
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
                    )
                  }

                  if (type === "date") {
                    return (
                      <label key={key} htmlFor={key} className="plasmo-block">
                        <span className="plasmo-block plasmo-text-xs plasmo-text-gray-700 plasmo-mb-1">
                          {label}
                        </span>
                        <input
                          id={key}
                          type="date"
                          max="2010-01-01"
                          value={form?.[key] || ""}
                          onChange={handleInputChange as any}
                          className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-md plasmo-px-2 plasmo-py-1.5 plasmo-text-sm plasmo-focus:outline-none plasmo-focus:ring-2 plasmo-focus:ring-blue-500"
                        />
                      </label>
                    )
                  }

                  // For sensitive fields, show/hide based on field-specific visibility
                  const isSensitive = sensitiveFields.has(key)
                  const isVisible = fieldVisibility[key]
                  // If sensitive and not visible, show as password, otherwise show as text
                  const renderType = isSensitive
                    ? isVisible
                      ? "text"
                      : "password"
                    : type

                  return (
                    <div key={key} className="plasmo-block plasmo-relative">
                      <span className="plasmo-block plasmo-text-xs plasmo-text-gray-700 plasmo-mb-1">
                        {label}
                      </span>
                      <div className="plasmo-relative">
                        <input
                          id={key}
                          type={renderType as any}
                          placeholder={label}
                          value={form?.[key] || ""}
                          onChange={handleInputChange as any}
                          className="plasmo-w-full plasmo-border plasmo-border-gray-300 plasmo-rounded-md plasmo-px-2 plasmo-py-1.5 plasmo-text-sm plasmo-focus:outline-none plasmo-focus:ring-2 plasmo-focus:ring-blue-500 plasmo-pr-8"
                        />
                        {isSensitive && (
                          <button
                            type="button"
                            onClick={() => toggleFieldVisibility(key)}
                            className="plasmo-absolute plasmo-right-2 plasmo-top-1/2 plasmo--translate-y-1/2 plasmo-text-gray-500 hover:plasmo-text-gray-700"
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
