import { AlertCircle, Check, RefreshCw, Wand2, X } from "lucide-react"
import { useState } from "react"

import React = require("react")

type FillResult = { filled?: number; total?: number } | null

export const FillButton = ({
  onResult,
  onStatusChange
}: {
  onResult?: (r: FillResult) => void
  onStatusChange?: (s: "idle" | "loading" | "success" | "error") => void
}) => {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error" | "noform" | "nodata"
  >("idle")
  const [dataSource, setDataSource] = useState<"custom" | "generated" | null>(
    null
  )

  const handleClick = async () => {
    try {
      setStatus("loading")
      if (onStatusChange) onStatusChange("loading")

      const response = await chrome.runtime.sendMessage({
        type: "TRIGGER_AUTOFILL",
        action: "fillCredentials"
      })

      if (response?.success) {
        const total = response.total ?? 0
        setDataSource(response.source || null)
        if (total === 0) {
          setStatus("noform")
          if (onStatusChange) onStatusChange("idle")
          if (onResult) onResult({ filled: 0, total: 0 })
        } else {
          setStatus("success")
          if (onStatusChange) onStatusChange("success")
          if (onResult)
            onResult({
              filled: response.filled ?? 0,
              total: response.total ?? 0
            })
        }

        // Reset status after 3 seconds
        setTimeout(() => {
          setStatus("idle")
          setDataSource(null)
          if (onStatusChange) onStatusChange("idle")
        }, 3000)
      } else {
        // Determine error type based on response
        const isAiDisabled = response?.aiEnabled === false
        setStatus(isAiDisabled ? "nodata" : "error")
        setDataSource(null)
        if (onStatusChange) onStatusChange("error")
        if (onResult) onResult({ filled: 0, total: 0 })

        // Reset status after 3 seconds
        setTimeout(() => {
          setStatus("idle")
          setDataSource(null)
          if (onStatusChange) onStatusChange("idle")
        }, 3000)
      }
    } catch (error) {
      console.error("Autofill error:", error)
      setStatus("error")
      setDataSource(null)
      if (onStatusChange) onStatusChange("error")
      if (onResult) onResult({ filled: 0, total: 0 })

      // Reset status after 3 seconds
      setTimeout(() => {
        setStatus("idle")
        setDataSource(null)
        if (onStatusChange) onStatusChange("idle")
      }, 3000)
    }
  }
  return (
    <section id="fill-button flex ">
      <button
        className="text-lg flex items-center justify-center gap-2 p-2 w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        onClick={handleClick}>
        {status === "loading" ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Auto Filling...</span>
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4" />
            <span className="font-semibold">AutoFill</span>
          </>
        )}
      </button>
      <div className="flex items-center justify-center mt-2">
        {status === "success" && (
          <span
            aria-label="filled"
            className="text-green-500 flex items-center gap-2">
            <Check className="w-5 h-5 animate-pulse" />
            <span className="text-sm text-green-600">
              Filled
              {dataSource === "generated" && " (Auto Generated)"}
              {dataSource === "custom" && " (Custom Data)"}
            </span>
          </span>
        )}
        {status === "error" && (
          <span
            aria-label="error"
            className="text-red-500 flex items-center gap-2">
            <X className="w-5 h-5 animate-pulse" />
            <span className="text-sm text-red-600">
              Failed to generate AI data. Try refresh data or toggle AI mode off
              and on below.
            </span>
          </span>
        )}
        {status === "nodata" && (
          <span
            aria-label="nodata"
            className="text-orange-500 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 animate-pulse" />
            <span className="text-sm text-orange-600">
              No custom data. Add data or enable AI mode.
            </span>
          </span>
        )}
        {status === "noform" && (
          <span
            aria-label="noform"
            className="text-yellow-600 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm text-yellow-700">
              No form detected
            </span>
          </span>
        )}
      </div>
    </section>
  )
}
