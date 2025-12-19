import {
  ArrowLeft,
  CreditCard,
  Crown,
  FileText,
  Globe,
  RefreshCw,
  Settings,
  User,
  Wand2
} from "lucide-react"
import { useEffect, useState } from "react"

import CustomTab from "~components/custom-tab"
import { FillButton } from "~components/fill-button"
import ProfileTab from "~components/profile-tab"
import RateLimitStatus from "~components/rate-limit-status"
import { getPaymentDetails } from "~lib/rateLimitService"
import { supabase } from "~lib/supabaseClient"
import { syncWebsiteProfilesToSupabase } from "~lib/syncService"

// Removed Gemini API key helpers (unused)

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

interface PaymentInfo {
  status: "PAID" | "PENDING" | "EXPIRED" | "NOT_FOUND" | "ERROR"
  expiresAt: string | null
  daysRemaining: number | null
}

export default function IndexPopup() {
  const [currentView, setCurrentView] = useState<View>("main")
  const [filledCount, setFilledCount] = useState<number | null>(null)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [isFilling, setIsFilling] = useState(false)
  const [aiModeEnabled, setAiModeEnabled] = useState(true)
  // Removed unused apiKey/hasApiKey state
  const [cacheStatus, setCacheStatus] = useState<string | null>(null)
  const [saveProfileRequest, setSaveProfileRequest] =
    useState<SaveProfileRequest | null>(null)
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [loadingPayment, setLoadingPayment] = useState(false)

  useEffect(() => {
    chrome.storage.local.get("aiModeEnabled", (res) => {
      setAiModeEnabled(res.aiModeEnabled !== false)
    })
    // Gemini API key logic removed (no UI usage)

    // Load payment info
    loadPaymentInfo()
  }, [])

  const loadPaymentInfo = async () => {
    setLoadingPayment(true)
    try {
      const details = await getPaymentDetails()
      setPaymentInfo(details)
    } catch (error) {
      console.error("Error loading payment info:", error)
    } finally {
      setLoadingPayment(false)
    }
  }

  const toggleAIMode = () => {
    const newValue = !aiModeEnabled
    setAiModeEnabled(newValue)
    chrome.storage.local.set({ aiModeEnabled: newValue }, () => {})
  }

  useEffect(() => {
    const port = chrome.runtime.connect({ name: "popup" })
    return () => port.disconnect()
  }, [])

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

  const handleSaveProfile = () => {
    if (!saveProfileRequest) return

    chrome.storage.local.get("websiteProfiles", (result) => {
      const profiles = result.websiteProfiles || []
      const newProfile = {
        id: crypto.randomUUID(),
        website: saveProfileRequest.website,
        url: saveProfileRequest.url,
        timestamp: Date.now(),
        data: saveProfileRequest.filledFields,
        filledFields: Object.keys(saveProfileRequest.filledFields)
      }
      profiles.push(newProfile)
      chrome.storage.local.set({ websiteProfiles: profiles }, async () => {
        setSaveProfileRequest(null)
        // Auto-sync to cloud after saving profile ONLY if authenticated
        try {
          const { data } = await supabase.auth.getSession()
          if (data?.session) {
            const result = await syncWebsiteProfilesToSupabase()
          }
        } catch (e) {}
      })
    })
  }

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
    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600">
      {children}
    </div>
  )

  return (
    <div className="w-full min-w-[320px] max-w-[480px] sm:w-96 md:w-[420px] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
      {currentView === "main" && (
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {saveProfileRequest && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-3 sm:p-4 shadow-lg animate-in slide-in-from-top">
              <div className="flex items-start gap-2 sm:gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-md">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1">
                    Save Profile?
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    Successfully filled{" "}
                    <span className="font-semibold text-blue-700">
                      {saveProfileRequest.filledCount} field
                      {saveProfileRequest.filledCount !== 1 ? "s" : ""}
                    </span>{" "}
                    on {saveProfileRequest.website}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-600 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      {Object.keys(saveProfileRequest.filledFields).length}{" "}
                      fields tracked
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDismissProfile}
                  className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all border border-gray-300 shadow-sm">
                  Not Now
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all shadow-md hover:shadow-lg">
                  Save
                </button>
              </div>
            </div>
          )}

          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <IconBox>
                <Wand2 size={18} className="text-white" />
              </IconBox>
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-1">
                FormGenie
                {paymentInfo?.status === "PAID" && (
                  <div title="Premium">
                    <Crown size={16} className="text-yellow-500" />
                  </div>
                )}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Click the button to auto-fill your credentials into focused fields
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <FillButton
                onResult={(r) => {
                  setFilledCount(r?.filled ?? 0)
                  setTotalCount(r?.total ?? 0)
                }}
                onStatusChange={(s) => setIsFilling(s === "loading")}
              />
            </div>

            {/* Rate Limit Status */}
            <RateLimitStatus />

            {(filledCount ?? 0) > 0 || (totalCount ?? 0) > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${isFilling ? "bg-yellow-400" : "bg-green-500"}`}
                    />
                    <span className="text-gray-600">
                      {isFilling ? "Filling..." : "Ready"}
                    </span>
                  </div>
                  <div className="text-gray-500">
                    {filledCount ?? 0}/{totalCount ?? 0} filled
                  </div>
                </div>

                <div className="flex gap-1 mt-1">
                  {Array.from({ length: Math.max(totalCount ?? 1, 1) }).map(
                    (_, i) => {
                      const filled = (filledCount ?? 0) > i
                      return (
                        <div
                          key={i}
                          className={`flex-1 h-2 rounded ${filled ? "bg-green-500" : "bg-gray-200"}`}></div>
                      )
                    }
                  )}
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2">
                <Wand2 size={16} className="text-purple-600" />
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    AI Mode
                  </div>
                  <p className="text-xs text-gray-500">
                    {aiModeEnabled ? "Generate dummy data" : "Custom data only"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
                  className="p-1 rounded text-purple-600 hover:bg-purple-100"
                  title="Generate new set of Dummy Data">
                  <RefreshCw
                    size={14}
                    className={cacheStatus === "cleared" ? "animate-spin" : ""}
                  />
                </button>
                <button
                  onClick={toggleAIMode}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                    aiModeEnabled ? "bg-purple-600" : "bg-gray-300"
                  }`}>
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                      aiModeEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200">
            <button
              onClick={() => setCurrentView("settings")}
              className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 py-2 rounded flex flex-col items-center justify-center gap-1">
              <Settings className="w-4 h-4" />
              <span className="text-xs">Settings</span>
            </button>
            <button
              onClick={() => setCurrentView("profile")}
              className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 py-2 rounded flex flex-col items-center justify-center gap-1">
              <FileText className="w-4 h-4" />
              <span className="text-xs">Profile</span>
            </button>
            <button
              onClick={() => setCurrentView("custom")}
              className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 py-2 rounded flex flex-col items-center justify-center gap-1">
              <User className="w-4 h-4" />
              <span className="text-xs">Custom</span>
            </button>
          </div>
        </div>
      )}

      {currentView === "settings" && (
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setCurrentView("main")}
              className="p-1 rounded text-gray-600">
              <ArrowLeft size={16} />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  const target = "/dashboard"
                  const url = chrome.runtime.getURL(`options.html#${target}`)
                  chrome.storage.local.set(
                    { optionsNavigateTo: target },
                    () => {
                      chrome.runtime.openOptionsPage(() => {
                        if (chrome.runtime.lastError) {
                          console.warn(
                            "openOptionsPage failed:",
                            chrome.runtime.lastError
                          )
                          if (chrome.tabs?.create) {
                            chrome.tabs.create({ url }, () => {
                              if (chrome.runtime.lastError) {
                                console.error(
                                  "tabs.create fallback failed:",
                                  chrome.runtime.lastError
                                )
                              }
                            })
                          }
                        }
                      })
                    }
                  )
                }}
                className="justify-center w-full text-sm py-2 border border-gray-200 rounded flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configuration
              </button>
              <button
                onClick={() => {
                  chrome.tabs.create({
                    url: "https://landing-page-autofill.vercel.app/"
                  })
                }}
                className="justify-center w-full text-sm py-2 border-gray-200 rounded text-black flex items-center gap-2 transition-all shadow-md">
                <Globe className="w-4 h-4" />
                Webpage
              </button>

              {/* Payment Info Section */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-800">
                    Payment Info
                  </h3>
                </div>

                {loadingPayment ? (
                  <div className="text-xs text-gray-600">Loading...</div>
                ) : paymentInfo ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Status:</span>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          paymentInfo.status === "PAID"
                            ? "bg-green-100 text-green-700"
                            : paymentInfo.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-700"
                              : paymentInfo.status === "EXPIRED"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                        }`}>
                        {paymentInfo.status === "PAID"
                          ? "✓ Active"
                          : paymentInfo.status === "PENDING"
                            ? "⏳ Pending"
                            : paymentInfo.status === "EXPIRED"
                              ? "✗ Expired"
                              : "No Subscription"}
                      </span>
                    </div>

                    {paymentInfo.expiresAt && paymentInfo.status === "PAID" && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">
                            Expires:
                          </span>
                          <span className="text-xs font-medium text-gray-800">
                            {new Date(
                              paymentInfo.expiresAt
                            ).toLocaleDateString()}
                          </span>
                        </div>

                        {paymentInfo.daysRemaining !== null && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">
                              Days Left:
                            </span>
                            <span
                              className={`text-xs font-semibold ${
                                paymentInfo.daysRemaining > 7
                                  ? "text-green-600"
                                  : paymentInfo.daysRemaining > 3
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }`}>
                              {paymentInfo.daysRemaining} day
                              {paymentInfo.daysRemaining !== 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {paymentInfo.expiresAt &&
                      paymentInfo.status === "EXPIRED" && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">
                            Expired on:
                          </span>
                          <span className="text-xs font-medium text-red-600">
                            {new Date(
                              paymentInfo.expiresAt
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                    {paymentInfo.status === "NOT_FOUND" && (
                      <p className="text-xs text-gray-500 italic">
                        No active subscription. Upgrade to Premium for unlimited
                        access!
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    Unable to load payment info
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
