import {
  ArrowLeft,
  Check,
  Edit2,
  Eye,
  EyeOff,
  Globe,
  Play,
  Trash2,
  X
} from "lucide-react"
import { useEffect, useState } from "react"

import React = require("react")

interface ProfileEntry {
  id: string
  website: string
  url: string
  timestamp: number
  data: Record<string, string>
  filledFields: string[]
}

export default function ProfileTab({ goBack }: { goBack: () => void }) {
  const [profiles, setProfiles] = useState<ProfileEntry[]>([])
  const [selectedProfile, setSelectedProfile] = useState<ProfileEntry | null>(
    null
  )
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<React.ReactNode>("")
  const [fieldVisibility, setFieldVisibility] = useState<
    Record<string, boolean>
  >({})
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const sensitiveFields = new Set([
    "password",
    "ssn",
    "driverslicense",
    "creditcardnumber",
    "cardverificationcode"
  ])

  // Load profiles from storage
  useEffect(() => {
    chrome.storage.local.get("websiteProfiles", (res) => {
      const savedProfiles = res.websiteProfiles || []
      setProfiles(
        savedProfiles.sort(
          (a: ProfileEntry, b: ProfileEntry) => b.timestamp - a.timestamp
        )
      )
    })
  }, [])

  const handleDelete = (profileId: string) => {
    const updated = profiles.filter((p) => p.id !== profileId)
    chrome.storage.local.set({ websiteProfiles: updated }, () => {
      setProfiles(updated)
      if (selectedProfile?.id === profileId) {
        setSelectedProfile(null)
      }
      setStatus(
        <span className="plasmo-flex plasmo-items-center plasmo-gap-2">
          <Trash2 className="plasmo-w-4 plasmo-h-4 plasmo-text-green-600" />
          <span className="plasmo-text-gray-700">Profile deleted</span>
        </span>
      )
      setTimeout(() => setStatus(""), 2000)
    })
  }

  const handleSaveEdit = () => {
    if (!selectedProfile) return

    const updated = profiles.map((p) =>
      p.id === selectedProfile.id ? { ...p, data: editedData } : p
    )

    chrome.storage.local.set({ websiteProfiles: updated }, () => {
      setProfiles(updated)
      setSelectedProfile({ ...selectedProfile, data: editedData })
      setIsEditing(false)
      setStatus(
        <span className="plasmo-flex plasmo-items-center plasmo-gap-2">
          <Check className="plasmo-w-4 plasmo-h-4 plasmo-text-green-600" />
          <span className="plasmo-text-gray-700">Profile updated</span>
        </span>
      )
      setTimeout(() => setStatus(""), 2000)
    })
  }

  const handleClearAll = () => {
    chrome.storage.local.set({ websiteProfiles: [] }, () => {
      setProfiles([])
      setSelectedProfile(null)
      setShowClearConfirm(false)
      setStatus(
        <span className="plasmo-flex plasmo-items-center plasmo-gap-2">
          <Check className="plasmo-w-4 plasmo-h-4 plasmo-text-green-600" />
          <span className="plasmo-text-gray-700">All profiles cleared</span>
        </span>
      )
      setTimeout(() => setStatus(""), 2000)
    })
  }

  const handleUseProfile = (profile: ProfileEntry) => {
    console.log("🔄 Using profile:", profile)
    console.log("📦 Profile data:", profile.data)

    // Send message to background to trigger autofill with this profile's data
    chrome.runtime.sendMessage(
      {
        type: "TRIGGER_AUTOFILL",
        useProfileData: profile.data
      },
      (response) => {
        console.log("📨 Response from background:", response)
        if (response?.success) {
          setStatus(
            <span className="plasmo-flex plasmo-items-center plasmo-gap-2">
              <Check className="plasmo-w-4 plasmo-h-4 plasmo-text-green-600" />
              <span className="plasmo-text-gray-700">
                Profile data filled successfully
              </span>
            </span>
          )
        } else {
          setStatus(
            <span className="plasmo-flex plasmo-items-center plasmo-gap-2">
              <X className="plasmo-w-4 plasmo-h-4 plasmo-text-red-600" />
              <span className="plasmo-text-gray-700">
                {response?.error || "Failed to fill profile"}
              </span>
            </span>
          )
        }
        setTimeout(() => setStatus(""), 3000)
      }
    )
  }

  const toggleFieldVisibility = (field: string) => {
    setFieldVisibility((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    )
  }

  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace("www.", "")
    } catch {
      return url
    }
  }

  // List view
  if (!selectedProfile) {
    return (
      <div className="plasmo-w-80 plasmo-bg-white plasmo-rounded-lg plasmo-shadow-2xl plasmo-border plasmo-border-gray-200 plasmo-overflow-hidden">
        <div className="plasmo-p-4 plasmo-space-y-4">
          {/* Clear All Confirmation Modal */}
          {showClearConfirm && (
            <div className="plasmo-bg-red-50 plasmo-border-2 plasmo-border-red-300 plasmo-rounded-lg plasmo-p-3 plasmo-mb-2">
              <div className="plasmo-flex plasmo-items-start plasmo-gap-2 plasmo-mb-3">
                <Trash2 className="plasmo-w-5 plasmo-h-5 plasmo-text-red-600 plasmo-flex-shrink-0 plasmo-mt-0.5" />
                <div className="plasmo-flex-1">
                  <h3 className="plasmo-text-sm plasmo-font-semibold plasmo-text-gray-900 plasmo-mb-1">
                    Clear All Profiles?
                  </h3>
                  <p className="plasmo-text-xs plasmo-text-gray-700">
                    This will permanently delete all {profiles.length} saved
                    profile{profiles.length !== 1 ? "s" : ""}. This action
                    cannot be undone.
                  </p>
                </div>
              </div>
              <div className="plasmo-flex plasmo-gap-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="plasmo-flex-1 plasmo-px-3 plasmo-py-1.5 plasmo-bg-white plasmo-text-gray-700 plasmo-rounded plasmo-text-xs plasmo-font-medium plasmo-border plasmo-border-gray-300">
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="plasmo-flex-1 plasmo-px-3 plasmo-py-1.5 plasmo-bg-red-600 plasmo-text-white plasmo-rounded plasmo-text-xs plasmo-font-medium">
                  Delete All
                </button>
              </div>
            </div>
          )}

          <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-gap-2">
            <div className="plasmo-flex plasmo-items-center plasmo-gap-2">
              <button
                onClick={goBack}
                className="plasmo-p-1 plasmo-rounded plasmo-text-gray-600">
                <ArrowLeft size={16} />
              </button>
              <h1 className="plasmo-text-sm plasmo-font-semibold plasmo-text-gray-800">
                Website Profiles
              </h1>
            </div>
            {profiles.length > 0 && !showClearConfirm && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="plasmo-text-xs plasmo-text-red-600 hover:plasmo-text-red-700">
                Clear All
              </button>
            )}
          </div>

          {profiles.length === 0 ? (
            <div className="plasmo-text-center plasmo-py-8 plasmo-text-gray-500">
              <Globe className="plasmo-w-12 plasmo-h-12 plasmo-mx-auto plasmo-mb-2 plasmo-text-gray-300" />
              <p className="plasmo-text-sm">No profiles yet</p>
              <p className="plasmo-text-xs plasmo-mt-1">
                Autofill data on websites to create profiles
              </p>
            </div>
          ) : (
            <div className="plasmo-space-y-2 plasmo-max-h-96 plasmo-overflow-y-auto">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="plasmo-p-3 plasmo-border plasmo-border-gray-200 plasmo-rounded-lg hover:plasmo-bg-gray-50">
                  <div className="plasmo-flex plasmo-items-start plasmo-justify-between plasmo-gap-2 plasmo-mb-2">
                    <div
                      className="plasmo-flex-1 plasmo-cursor-pointer"
                      onClick={() => setSelectedProfile(profile)}>
                      <div className="plasmo-flex plasmo-items-center plasmo-gap-2">
                        <Globe size={14} className="plasmo-text-blue-600" />
                        <h3 className="plasmo-text-sm plasmo-font-medium plasmo-text-gray-800">
                          {getDomain(profile.url)}
                        </h3>
                      </div>
                      <p className="plasmo-text-xs plasmo-text-gray-500 plasmo-mt-1">
                        {formatDate(profile.timestamp)}
                      </p>
                      <p className="plasmo-text-xs plasmo-text-gray-600 plasmo-mt-1">
                        {profile.filledFields.length} fields filled
                      </p>
                    </div>
                    <div className="plasmo-flex plasmo-flex-col plasmo-gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUseProfile(profile)
                        }}
                        className="plasmo-p-1.5 plasmo-text-blue-600 hover:plasmo-bg-blue-50 plasmo-rounded"
                        title="Use this profile">
                        <Play size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(profile.id)
                        }}
                        className="plasmo-p-1.5 plasmo-text-gray-400 hover:plasmo-text-red-600 hover:plasmo-bg-red-50 plasmo-rounded"
                        title="Delete profile">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {status && (
            <div className="plasmo-text-center plasmo-text-sm">{status}</div>
          )}
        </div>
      </div>
    )
  }

  // Detail/Edit view
  return (
    <div className="plasmo-w-80 plasmo-bg-white plasmo-rounded-lg plasmo-shadow-2xl plasmo-border plasmo-border-gray-200 plasmo-overflow-hidden">
      <div className="plasmo-p-4 plasmo-space-y-4">
        <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-gap-2">
          <div className="plasmo-flex plasmo-items-center plasmo-gap-2">
            <button
              onClick={() => {
                setSelectedProfile(null)
                setIsEditing(false)
              }}
              className="plasmo-p-1 plasmo-rounded plasmo-text-gray-600">
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="plasmo-text-sm plasmo-font-semibold plasmo-text-gray-800">
                {getDomain(selectedProfile.url)}
              </h1>
              <p className="plasmo-text-xs plasmo-text-gray-500">
                {formatDate(selectedProfile.timestamp)}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isEditing) {
                setIsEditing(false)
              } else {
                setEditedData({ ...selectedProfile.data })
                setIsEditing(true)
              }
            }}
            className="plasmo-p-1 plasmo-rounded plasmo-text-gray-600 hover:plasmo-bg-gray-100">
            {isEditing ? <X size={16} /> : <Edit2 size={16} />}
          </button>
        </div>

        <div className="plasmo-space-y-2 plasmo-max-h-96 plasmo-overflow-y-auto plasmo-pr-2">
          {selectedProfile.filledFields.map((field) => {
            const value = isEditing
              ? editedData[field]
              : selectedProfile.data[field]
            const isSensitive = sensitiveFields.has(field)
            const isVisible = fieldVisibility[field]

            return (
              <div key={field} className="plasmo-space-y-1">
                <label className="plasmo-text-xs plasmo-font-medium plasmo-text-gray-600 plasmo-capitalize">
                  {field.replace(/([A-Z])/g, " $1").trim()}
                </label>
                <div className="plasmo-relative">
                  {isEditing ? (
                    <input
                      type={isSensitive && !isVisible ? "password" : "text"}
                      value={value || ""}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          [field]: e.target.value
                        })
                      }
                      className="plasmo-w-full plasmo-text-sm plasmo-px-2 plasmo-py-1.5 plasmo-border plasmo-border-gray-300 plasmo-rounded plasmo-pr-8"
                    />
                  ) : (
                    <div className="plasmo-text-sm plasmo-px-2 plasmo-py-1.5 plasmo-bg-gray-50 plasmo-border plasmo-border-gray-200 plasmo-rounded plasmo-pr-8 plasmo-break-all">
                      {isSensitive && !isVisible ? "••••••••" : value || "—"}
                    </div>
                  )}
                  {isSensitive && (
                    <button
                      onClick={() => toggleFieldVisibility(field)}
                      className="plasmo-absolute plasmo-right-2 plasmo-top-1/2 plasmo--translate-y-1/2 plasmo-text-gray-500 hover:plasmo-text-gray-700">
                      {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {isEditing && (
          <div className="plasmo-flex plasmo-gap-2 plasmo-pt-2 plasmo-border-t plasmo-border-gray-200">
            <button
              onClick={() => setIsEditing(false)}
              className="plasmo-flex-1 plasmo-py-2 plasmo-text-sm plasmo-bg-gray-100 plasmo-rounded">
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="plasmo-flex-1 plasmo-py-2 plasmo-text-sm plasmo-bg-blue-600 plasmo-text-white plasmo-rounded">
              Save Changes
            </button>
          </div>
        )}

        {status && (
          <div className="plasmo-text-center plasmo-text-sm">{status}</div>
        )}
      </div>
    </div>
  )
}
