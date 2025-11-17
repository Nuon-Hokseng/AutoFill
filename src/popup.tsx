import {
  ArrowLeft,
  CreditCard,
  FileText,
  Globe,
  RefreshCw,
  Settings,
  Trash2,
  User,
  Wand2
} from "lucide-react"
import { useEffect, useState } from "react"

import CustomTab from "~components/custom-tab"
import { FillButton } from "~components/fill-button"
import ProfileTab from "~components/profile-tab"
import {
  clearGeminiApiKey,
  getGeminiApiKey,
  setGeminiApiKey
} from "~services/storageService"

import "~style.css"

import React = require("react")

type View = "main" | "settings" | "custom" | "profile"

interface SaveProfileRequest {
  website: string
  url: string
  filledFields: Record<string, string>
  filledCount: number
  totalCount: number
}

export default function IndexPopup() {
  const [currentView, setCurrentView] = useState<View>("main")
  const [filledCount, setFilledCount] = useState<number | null>(null)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [isFilling, setIsFilling] = useState(false)
  const [aiModeEnabled, setAiModeEnabled] = useState(true)
  const [apiKey, setApiKey] = useState("")
  const [hasApiKey, setHasApiKey] = useState(false)
  const [cacheStatus, setCacheStatus] = useState<string | null>(null)
  const [saveProfileRequest, setSaveProfileRequest] =
    useState<SaveProfileRequest | null>(null)

  // Load AI mode setting on mount
  useEffect(() => {
    chrome.storage.local.get("aiModeEnabled", (res) => {
      setAiModeEnabled(res.aiModeEnabled !== false) // Default to true
    })
    getGeminiApiKey().then((k) => {
      setHasApiKey(!!k)
      setApiKey(k ? "" : "")
    })
  }, [])

  // Toggle AI mode
  const toggleAIMode = () => {
    const newValue = !aiModeEnabled
    setAiModeEnabled(newValue)
    chrome.storage.local.set({ aiModeEnabled: newValue }, () => {
      console.log(`🤖 AI mode ${newValue ? "enabled" : "disabled"}`)
    })
  }

  // Connect to background script to trigger preload
  useEffect(() => {
    const port = chrome.runtime.connect({ name: "popup" })
    return () => port.disconnect()
  }, [])

  // Listen for save profile requests
  useEffect(() => {
    const handleMessage = (
      message: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      if (message.type === "SAVE_PROFILE_REQUEST") {
        setSaveProfileRequest(message.data)
        sendResponse({ received: true })
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage)
    }
  }, [])

  // Handle save profile
  const handleSaveProfile = () => {
    if (!saveProfileRequest) return

    console.log("💾 Saving profile request:", saveProfileRequest)
    console.log("📝 Filled fields to save:", saveProfileRequest.filledFields)

    chrome.storage.local.get("websiteProfiles", (result) => {
      const profiles = result.websiteProfiles || []
      const newProfile = {
        id: Date.now().toString(),
        website: saveProfileRequest.website,
        url: saveProfileRequest.url,
        timestamp: Date.now(),
        data: saveProfileRequest.filledFields,
        filledFields: Object.keys(saveProfileRequest.filledFields)
      }
      profiles.push(newProfile)
      chrome.storage.local.set({ websiteProfiles: profiles }, () => {
        console.log("✅ Profile saved successfully", newProfile)
        console.log("🔍 Saved profile data:", newProfile.data)
        setSaveProfileRequest(null)
      })
    })
  }

  // Handle dismiss profile request
  const handleDismissProfile = () => {
    setSaveProfileRequest(null)
  }

  if (currentView === "custom") {
    return <CustomTab goBack={() => setCurrentView("main")} />
  }

  if (currentView === "profile") {
    return <ProfileTab goBack={() => setCurrentView("main")} />
  }

  const IconBox = ({ children }: { children: React.ReactNode }) => (
    <div className="plasmo-w-8 plasmo-h-8 plasmo-rounded-lg plasmo-flex plasmo-items-center plasmo-justify-center plasmo-bg-gradient-to-r plasmo-from-blue-500 plasmo-to-blue-600">
      {children}
    </div>
  )

  return (
    <div className="plasmo-w-80 plasmo-bg-white plasmo-rounded-lg plasmo-shadow-2xl plasmo-border plasmo-border-gray-200 plasmo-overflow-hidden">
      {currentView === "main" && (
        <div className="plasmo-p-4 plasmo-space-y-4">
          {/* Save Profile Notification */}
          {saveProfileRequest && (
            <div className="plasmo-bg-gradient-to-r plasmo-from-blue-50 plasmo-to-indigo-50 plasmo-border-2 plasmo-border-blue-300 plasmo-rounded-xl plasmo-p-4 plasmo-shadow-lg plasmo-animate-in plasmo-slide-in-from-top">
              <div className="plasmo-flex plasmo-items-start plasmo-gap-3 plasmo-mb-3">
                <div className="plasmo-w-10 plasmo-h-10 plasmo-rounded-full plasmo-bg-blue-500 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-flex-shrink-0 plasmo-shadow-md">
                  <FileText className="plasmo-w-5 plasmo-h-5 plasmo-text-white" />
                </div>
                <div className="plasmo-flex-1">
                  <h3 className="plasmo-text-base plasmo-font-bold plasmo-text-gray-900 plasmo-mb-1">
                    Save Profile?
                  </h3>
                  <p className="plasmo-text-sm plasmo-text-gray-700 plasmo-leading-relaxed">
                    Successfully filled{" "}
                    <span className="plasmo-font-semibold plasmo-text-blue-700">
                      {saveProfileRequest.filledCount} field
                      {saveProfileRequest.filledCount !== 1 ? "s" : ""}
                    </span>{" "}
                    on {saveProfileRequest.website}
                  </p>
                  <div className="plasmo-flex plasmo-items-center plasmo-gap-2 plasmo-mt-2">
                    <div className="plasmo-flex plasmo-items-center plasmo-gap-1 plasmo-px-2 plasmo-py-1 plasmo-bg-white plasmo-rounded-full plasmo-text-xs plasmo-font-medium plasmo-text-gray-600 plasmo-shadow-sm">
                      <span className="plasmo-w-2 plasmo-h-2 plasmo-rounded-full plasmo-bg-green-500"></span>
                      {Object.keys(saveProfileRequest.filledFields).length}{" "}
                      fields tracked
                    </div>
                  </div>
                </div>
              </div>
              <div className="plasmo-flex plasmo-gap-2">
                <button
                  onClick={handleDismissProfile}
                  className="plasmo-flex-1 plasmo-px-4 plasmo-py-2 plasmo-bg-white plasmo-text-gray-700 plasmo-rounded-lg plasmo-font-medium plasmo-hover:bg-gray-50 plasmo-transition-all plasmo-border plasmo-border-gray-300 plasmo-shadow-sm">
                  Not Now
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="plasmo-flex-1 plasmo-px-4 plasmo-py-2 plasmo-bg-blue-600 plasmo-text-white plasmo-rounded-lg plasmo-font-medium plasmo-hover:bg-blue-700 plasmo-transition-all plasmo-shadow-md plasmo-hover:shadow-lg">
                  Save
                </button>
              </div>
            </div>
          )}

          <div className="plasmo-text-center plasmo-space-y-2">
            <div className="plasmo-flex plasmo-items-center plasmo-justify-center plasmo-gap-2 plasmo-mb-2">
              <IconBox>
                <Wand2 size={18} className="plasmo-text-white" />
              </IconBox>
              <h2 className="plasmo-text-lg plasmo-font-semibold plasmo-text-gray-800">
                Auto Fill Extension
              </h2>
            </div>
            <p className="plasmo-text-sm plasmo-text-gray-600 plasmo-leading-relaxed">
              Click the button to auto-fill your credentials into focused fields
            </p>
          </div>

          <div className="plasmo-space-y-3">
            <div>
              <FillButton
                onResult={(r) => {
                  setFilledCount(r?.filled ?? 0)
                  setTotalCount(r?.total ?? 0)
                }}
                onStatusChange={(s) => setIsFilling(s === "loading")}
              />
            </div>

            <div className="plasmo-space-y-2">
              <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-text-sm">
                <div className="plasmo-flex plasmo-items-center plasmo-gap-2">
                  <div
                    className={`plasmo-w-2 plasmo-h-2 plasmo-rounded-full ${isFilling ? "plasmo-bg-yellow-400" : "plasmo-bg-green-500"}`}
                  />
                  <span className="plasmo-text-gray-600">
                    {isFilling ? "Filling..." : "Ready"}
                  </span>
                </div>
                <div className="plasmo-text-gray-500">
                  {filledCount ?? 0}/{totalCount ?? 0} filled
                </div>
              </div>

              <div className="plasmo-flex plasmo-gap-1 plasmo-mt-1">
                {Array.from({ length: Math.max(totalCount ?? 1, 1) }).map(
                  (_, i) => {
                    const filled = (filledCount ?? 0) > i
                    return (
                      <div
                        key={i}
                        className={`plasmo-flex-1 plasmo-h-2 plasmo-rounded ${filled ? "plasmo-bg-green-500" : "plasmo-bg-gray-200"}`}></div>
                    )
                  }
                )}
              </div>
            </div>

            {/* AI Mode Toggle */}
            <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-p-3 plasmo-bg-gradient-to-r plasmo-from-purple-50 plasmo-to-blue-50 plasmo-rounded-lg plasmo-border plasmo-border-purple-200">
              <div className="plasmo-flex plasmo-items-center plasmo-gap-2">
                <Wand2 size={16} className="plasmo-text-purple-600" />
                <div>
                  <div className="plasmo-text-sm plasmo-font-medium plasmo-text-gray-700">
                    AI Mode
                  </div>
                  <p className="plasmo-text-xs plasmo-text-gray-500">
                    {aiModeEnabled ? "Generate dummy data" : "Custom data only"}
                  </p>
                </div>
              </div>
              <div className="plasmo-flex plasmo-items-center plasmo-gap-2">
                <button
                  onClick={() => {
                    chrome.runtime.sendMessage(
                      { type: "CLEAR_AI_CACHE" },
                      (res?: { success?: boolean }) => {
                        if (res?.success) {
                          setCacheStatus("cleared")
                          setTimeout(() => setCacheStatus(null), 2000)
                        } else {
                          setCacheStatus("error")
                          setTimeout(() => setCacheStatus(null), 2000)
                        }
                      }
                    )
                  }}
                  className="plasmo-p-1 plasmo-rounded plasmo-text-purple-600 hover:plasmo-bg-purple-100"
                  title="Clear AI cache">
                  <RefreshCw
                    size={14}
                    className={
                      cacheStatus === "cleared" ? "plasmo-animate-spin" : ""
                    }
                  />
                </button>
                <button
                  onClick={toggleAIMode}
                  className={`plasmo-relative plasmo-w-11 plasmo-h-6 plasmo-rounded-full plasmo-transition-colors plasmo-duration-200 ${
                    aiModeEnabled
                      ? "plasmo-bg-purple-600"
                      : "plasmo-bg-gray-300"
                  }`}>
                  <div
                    className={`plasmo-absolute plasmo-top-0.5 plasmo-left-0.5 plasmo-w-5 plasmo-h-5 plasmo-bg-white plasmo-rounded-full plasmo-transition-transform plasmo-duration-200 ${
                      aiModeEnabled
                        ? "plasmo-translate-x-5"
                        : "plasmo-translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
          <div className="plasmo-grid plasmo-grid-cols-3 plasmo-gap-2 plasmo-pt-2 plasmo-border-t plasmo-border-gray-200">
            <button
              onClick={() => setCurrentView("settings")}
              className="plasmo-text-gray-600 plasmo-hover:text-gray-800 plasmo-hover:bg-gray-100 plasmo-py-2 plasmo-rounded plasmo-flex plasmo-flex-col plasmo-items-center plasmo-justify-center plasmo-gap-1">
              <Settings className="plasmo-w-4 plasmo-h-4" />
              <span className="plasmo-text-xs">Settings</span>
            </button>
            <button
              onClick={() => setCurrentView("profile")}
              className="plasmo-text-gray-600 plasmo-hover:text-gray-800 plasmo-hover:bg-gray-100 plasmo-py-2 plasmo-rounded plasmo-flex plasmo-flex-col plasmo-items-center plasmo-justify-center plasmo-gap-1">
              <FileText className="plasmo-w-4 plasmo-h-4" />
              <span className="plasmo-text-xs">Profile</span>
            </button>
            <button
              onClick={() => setCurrentView("custom")}
              className="plasmo-text-gray-600 plasmo-hover:text-gray-800 plasmo-hover:bg-gray-100 plasmo-py-2 plasmo-rounded plasmo-flex plasmo-flex-col plasmo-items-center plasmo-justify-center plasmo-gap-1">
              <User className="plasmo-w-4 plasmo-h-4" />
              <span className="plasmo-text-xs">Custom</span>
            </button>
          </div>
        </div>
      )}

      {currentView === "settings" && (
        <div className="plasmo-p-4 plasmo-space-y-4">
          <div className="plasmo-flex plasmo-items-center plasmo-gap-2 plasmo-mb-4">
            <button
              onClick={() => setCurrentView("main")}
              className="plasmo-p-1 plasmo-rounded plasmo-text-gray-600">
              <ArrowLeft size={16} />
            </button>
            <h2 className="plasmo-text-lg plasmo-font-semibold plasmo-text-gray-800">
              Settings
            </h2>
          </div>

          <div className="plasmo-space-y-4">
            <div className="plasmo-space-y-2 plasmo-pt-4 plasmo-border-t plasmo-border-gray-200">
              <button
                onClick={() => chrome.runtime.openOptionsPage()}
                className="plasmo-justify-center plasmo-w-full plasmo-text-sm plasmo-py-2 plasmo-border plasmo-border-gray-200 plasmo-rounded plasmo-flex plasmo-items-center plasmo-gap-2">
                <Globe className="plasmo-w-4 plasmo-h-4" />
                Manage Websites
              </button>
              <button className="plasmo-justify-center plasmo-w-full plasmo-text-sm plasmo-py-2 plasmo-border plasmo-border-gray-200 plasmo-rounded plasmo-flex plasmo-items-center plasmo-gap-2">
                <CreditCard className="plasmo-w-4 plasmo-h-4" />
                Payment Info
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
