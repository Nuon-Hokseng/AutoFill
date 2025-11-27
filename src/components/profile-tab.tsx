import {
  ArrowLeft,
  Check,
  Cloud,
  CloudOff,
  Edit2,
  Eye,
  EyeOff,
  Globe,
  Play,
  RefreshCw,
  Trash2,
  X
} from "lucide-react"
import { useEffect, useState } from "react"

import {
  getLastSyncTime,
  syncWebsiteProfilesFromSupabase,
  syncWebsiteProfilesToSupabase
} from "~lib/syncService"

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
  const [syncing, setSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null)

  const sensitiveFields = new Set(["password"])

  // Load profiles from storage
  useEffect(() => {
    // Load last sync time
    getLastSyncTime().then(setLastSyncTime)

    chrome.storage.local.get("websiteProfiles", (res) => {
      const savedProfiles = res.websiteProfiles || []
      setProfiles(
        savedProfiles.sort(
          (a: ProfileEntry, b: ProfileEntry) => b.timestamp - a.timestamp
        )
      )
    })
  }, [])

  const handleSyncToCloud = async () => {
    setSyncing(true)
    const result = await syncWebsiteProfilesToSupabase()
    setSyncing(false)

    if (result.success) {
      setLastSyncTime(result.syncedAt || Date.now())
      setStatus(
        <span className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-green-600" />
          <span className="text-gray-700">Synced to cloud</span>
        </span>
      )
    } else {
      console.error("Sync to cloud failed:", result.error)
      setStatus(
        <span className="flex items-center gap-2">
          <CloudOff className="w-4 h-4 text-red-600" />
          <span className="text-gray-700 text-left">
            Sync failed: {result.error || "Unknown error"}
          </span>
        </span>
      )
    }
    setTimeout(() => setStatus(""), 5000)
  }

  const handleSyncFromCloud = async () => {
    setSyncing(true)
    const result = await syncWebsiteProfilesFromSupabase()
    setSyncing(false)

    if (result.success) {
      setLastSyncTime(result.syncedAt || Date.now())
      // Reload profiles from storage
      chrome.storage.local.get("websiteProfiles", (res) => {
        const savedProfiles = res.websiteProfiles || []
        setProfiles(
          savedProfiles.sort(
            (a: ProfileEntry, b: ProfileEntry) => b.timestamp - a.timestamp
          )
        )
      })
      setStatus(
        <span className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-green-600" />
          <span className="text-gray-700">Synced from cloud</span>
        </span>
      )
    } else {
      console.error("Sync from cloud failed:", result.error)
      setStatus(
        <span className="flex items-center gap-2">
          <CloudOff className="w-4 h-4 text-red-600" />
          <span className="text-gray-700 text-left">
            Sync failed: {result.error || "Unknown error"}
          </span>
        </span>
      )
    }
    setTimeout(() => setStatus(""), 5000)
  }

  const handleDelete = (profileId: string) => {
    const updated = profiles.filter((p) => p.id !== profileId)
    chrome.storage.local.set({ websiteProfiles: updated }, () => {
      setProfiles(updated)
      if (selectedProfile?.id === profileId) {
        setSelectedProfile(null)
      }
      setStatus(
        <span className="flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-green-600" />
          <span className="text-gray-700">Profile deleted</span>
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
        <span className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <span className="text-gray-700">Profile updated</span>
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
        <span className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <span className="text-gray-700">All profiles cleared</span>
        </span>
      )
      setTimeout(() => setStatus(""), 2000)
    })
  }

  const handleUseProfile = (profile: ProfileEntry) => {
    // Send message to background to trigger autofill with this profile's data
    chrome.runtime.sendMessage(
      {
        type: "TRIGGER_AUTOFILL",
        useProfileData: profile.data
      },
      (response) => {
        if (response?.success) {
          setStatus(
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-gray-700">
                Profile data filled successfully
              </span>
            </span>
          )
        } else {
          setStatus(
            <span className="flex items-center gap-2">
              <X className="w-4 h-4 text-red-600" />
              <span className="text-gray-700">
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
      <div className="w-80 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 space-y-4">
          {/* Clear All Confirmation Modal */}
          {showClearConfirm && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 mb-2">
              <div className="flex items-start gap-2 mb-3">
                <Trash2 className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    Clear All Profiles?
                  </h3>
                  <p className="text-xs text-gray-700">
                    This will permanently delete all {profiles.length} saved
                    profile{profiles.length !== 1 ? "s" : ""}. This action
                    cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-3 py-1.5 bg-white text-gray-700 rounded text-xs font-medium border border-gray-300">
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium">
                  Delete All
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button onClick={goBack} className="p-1 rounded text-gray-600">
                <ArrowLeft size={16} />
              </button>
              <h1 className="text-sm font-semibold text-gray-800">
                Website Profiles
              </h1>
            </div>
            {profiles.length > 0 && !showClearConfirm && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-xs text-red-600 hover:text-red-700">
                Clear All
              </button>
            )}
          </div>

          {lastSyncTime && (
            <p className="text-xs text-gray-500 text-center">
              Last synced: {new Date(lastSyncTime).toLocaleString()}
            </p>
          )}

          {profiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Globe className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No profiles yet</p>
              <p className="text-xs mt-1">
                Autofill data on websites to create profiles
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => setSelectedProfile(profile)}>
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="text-blue-600" />
                        <h3 className="text-sm font-medium text-gray-800">
                          {getDomain(profile.url)}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(profile.timestamp)}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {profile.filledFields.length} fields filled
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUseProfile(profile)
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Use this profile">
                        <Play size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(profile.id)
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete profile">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {status && <div className="text-center text-sm">{status}</div>}
        </div>
      </div>
    )
  }

  // Detail/Edit view
  return (
    <div className="w-80 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedProfile(null)
                setIsEditing(false)
              }}
              className="p-1 rounded text-gray-600">
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-gray-800">
                {getDomain(selectedProfile.url)}
              </h1>
              <p className="text-xs text-gray-500">
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
            className="p-1 rounded text-gray-600 hover:bg-gray-100">
            {isEditing ? <X size={16} /> : <Edit2 size={16} />}
          </button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {selectedProfile.filledFields.map((field) => {
            const value = isEditing
              ? editedData[field]
              : selectedProfile.data[field]
            const isSensitive = sensitiveFields.has(field)
            const isVisible = fieldVisibility[field]

            return (
              <div key={field} className="space-y-1">
                <label className="text-xs font-medium text-gray-600 capitalize">
                  {field.replace(/([A-Z])/g, " $1").trim()}
                </label>
                <div className="relative">
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
                      className="w-full text-sm px-2 py-1.5 border border-gray-300 rounded pr-8"
                    />
                  ) : (
                    <div className="text-sm px-2 py-1.5 bg-gray-50 border border-gray-200 rounded pr-8 break-all">
                      {isSensitive && !isVisible ? "••••••••" : value || "—"}
                    </div>
                  )}
                  {isSensitive && (
                    <button
                      onClick={() => toggleFieldVisibility(field)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                      {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {isEditing && (
          <div className="flex gap-2 pt-2 border-t border-gray-200">
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 py-2 text-sm bg-gray-100 rounded">
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="flex-1 py-2 text-sm bg-blue-600 text-white rounded">
              Save Changes
            </button>
          </div>
        )}

        {status && <div className="text-center text-sm">{status}</div>}
      </div>
    </div>
  )
}
