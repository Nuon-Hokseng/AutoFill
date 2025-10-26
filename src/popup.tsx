import {
  ArrowLeft,
  CreditCard,
  Globe,
  Settings,
  Trash2,
  User,
  Wand2
} from "lucide-react"
import React, { useState } from "react"

import CustomTab from "~features/custom-tab"
import { FillButton } from "~features/fill-button"

import "~style.css"

type View = "main" | "settings" | "custom"

export default function IndexPopup() {
  const [currentView, setCurrentView] = useState<View>("main")
  const [filledCount, setFilledCount] = useState<number | null>(null)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [isFilling, setIsFilling] = useState(false)

  if (currentView === "custom") {
    return <CustomTab goBack={() => setCurrentView("main")} />
  }

  const IconBox = ({ children }: { children: React.ReactNode }) => (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600">
      {children}
    </div>
  )

  return (
    <div className="w-80 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
      {currentView === "main" && (
        <div className="p-4 space-y-4">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <IconBox>
                <Wand2 size={18} className="text-white" />
              </IconBox>
              <h2 className="text-lg font-semibold text-gray-800">
                Auto Fill Extension
              </h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
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
          </div>
          <div className="flex gap-2 pt-2 border-t border-gray-200">
            <button
              onClick={() => setCurrentView("settings")}
              className="flex-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 py-2 rounded flex items-center justify-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button
              onClick={() => setCurrentView("custom")}
              className="flex-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 py-2 rounded flex items-center justify-center gap-2">
              <User className="w-4 h-4" />
              Custom
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
            <h2 className="text-lg font-semibold text-gray-800">
              Settings
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-medium text-gray-700">
                  Auto Fill Enabled
                </div>
                <p className="text-xs text-gray-500">
                  Enable automatic form filling
                </p>
              </div>
              <input type="checkbox" defaultChecked />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-medium text-gray-700">
                  Smart Detection
                </div>
                <p className="text-xs text-gray-500">
                  Automatically detect form fields
                </p>
              </div>
              <input type="checkbox" defaultValue={0} />
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => chrome.runtime.openOptionsPage()}
                className="justify-center w-full text-sm py-2 border border-gray-200 rounded flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Manage Websites
              </button>
              <button className="justify-center w-full text-sm py-2 border border-gray-200 rounded flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payment Info
              </button>
              <button className="justify-center w-full text-sm py-2 border border-gray-200 rounded text-red-600 flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
