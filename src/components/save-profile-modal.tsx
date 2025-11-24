import { Check, Key, X } from "lucide-react"
import { useEffect, useState } from "react"

import React = require("react")

interface SaveProfileModalProps {
  website: string
  url: string
  filledFields: Record<string, string>
  filledCount: number
  totalCount: number
  onSave: () => void
  onCancel: () => void
}

const SaveProfileModal: React.FC<SaveProfileModalProps> = ({
  website,
  filledCount,
  onSave,
  onCancel
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  const handleSave = () => {
    setIsVisible(false)
    setTimeout(onSave, 150)
  }

  const handleCancel = () => {
    setIsVisible(false)
    setTimeout(onCancel, 150)
  }

  return (
    <div
      className="fixed top-4 right-4 z-[999999] pointer-events-none"
      style={{
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}>
      <div
        className={`bg-white rounded-lg shadow-2xl border border-gray-200 pointer-events-auto transition-all duration-200 w-80 ${
          isVisible
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-4"
        }`}
        style={{
          boxShadow:
            "0 10px 40px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)"
        }}>
        <div className="flex items-center gap-3 p-4">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <Key className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900">
              Save password for{" "}
              <span className="font-semibold">{website}</span>?
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {filledCount} field{filledCount !== 1 ? "s" : ""} filled
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors font-medium">
              Never
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium flex items-center gap-1.5">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SaveProfileModal
