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
      className="plasmo-fixed plasmo-top-4 plasmo-right-4 plasmo-z-[999999] plasmo-pointer-events-none"
      style={{
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}>
      <div
        className={`plasmo-bg-white plasmo-rounded-lg plasmo-shadow-2xl plasmo-border plasmo-border-gray-200 plasmo-pointer-events-auto plasmo-transition-all plasmo-duration-200 plasmo-w-80 ${
          isVisible
            ? "plasmo-opacity-100 plasmo-translate-x-0"
            : "plasmo-opacity-0 plasmo-translate-x-4"
        }`}
        style={{
          boxShadow:
            "0 10px 40px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)"
        }}>
        <div className="plasmo-flex plasmo-items-center plasmo-gap-3 plasmo-p-4">
          <div className="plasmo-w-8 plasmo-h-8 plasmo-rounded-full plasmo-bg-blue-500 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-flex-shrink-0">
            <Key className="plasmo-w-4 plasmo-h-4 plasmo-text-white" />
          </div>
          <div className="plasmo-flex-1 plasmo-min-w-0">
            <div className="plasmo-text-sm plasmo-font-medium plasmo-text-gray-900">
              Save password for{" "}
              <span className="plasmo-font-semibold">{website}</span>?
            </div>
            <div className="plasmo-text-xs plasmo-text-gray-500 plasmo-mt-0.5">
              {filledCount} field{filledCount !== 1 ? "s" : ""} filled
            </div>
          </div>
          <div className="plasmo-flex plasmo-gap-2 plasmo-flex-shrink-0">
            <button
              onClick={handleCancel}
              className="plasmo-px-3 plasmo-py-1.5 plasmo-text-sm plasmo-text-gray-600 plasmo-hover:text-gray-800 plasmo-hover:bg-gray-100 plasmo-rounded plasmo-transition-colors plasmo-font-medium">
              Never
            </button>
            <button
              onClick={handleSave}
              className="plasmo-px-3 plasmo-py-1.5 plasmo-text-sm plasmo-bg-blue-600 plasmo-text-white plasmo-rounded plasmo-hover:bg-blue-700 plasmo-transition-colors plasmo-font-medium plasmo-flex plasmo-items-center plasmo-gap-1.5">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SaveProfileModal
