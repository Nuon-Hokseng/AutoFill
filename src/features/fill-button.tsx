import { AlertCircle, Check, RefreshCw, Wand2, X } from "lucide-react"
import { useState } from "react"

type FillResult = { filled?: number; total?: number } | null

export const FillButton = ({
  onResult,
  onStatusChange
}: {
  onResult?: (r: FillResult) => void
  onStatusChange?: (s: "idle" | "loading" | "success" | "error") => void
}) => {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error" | "noform"
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
      } else {
        setStatus("error")
        setDataSource(null)
        if (onStatusChange) onStatusChange("error")
        if (onResult) onResult({ filled: 0, total: 0 })
      }
    } catch (error) {
      console.error("Autofill error:", error)
      setStatus("error")
      setDataSource(null)
      if (onStatusChange) onStatusChange("error")
      if (onResult) onResult({ filled: 0, total: 0 })
    }
    setTimeout(() => {
      setStatus("idle")
      setDataSource(null)
      if (onStatusChange) onStatusChange("idle")
    }, 3000)
  }
  return (
    <section id="fill-button plasmo-flex ">
      <button
        className="plasmo-text-lg plasmo-flex plasmo-items-center plasmo-justify-center plasmo-gap-2 plasmo-p-2 plasmo-w-full plasmo-px-4 plasmo-py-2 plasmo-bg-blue-500 plasmo-text-white plasmo-rounded hover:plasmo-bg-blue-600 plasmo-transition"
        onClick={handleClick}>
        {status === "loading" ? (
          <>
            <RefreshCw className="plasmo-w-4 plasmo-h-4 plasmo-animate-spin" />
            <span>Auto Filling...</span>
          </>
        ) : (
          <>
            <Wand2 className="plasmo-w-4 plasmo-h-4" />
            <span className="plasmo-font-semibold">AutoFill</span>
          </>
        )}
      </button>
      <div className="plasmo-flex plasmo-items-center plasmo-justify-center plasmo-mt-2">
        {status === "success" && (
          <span
            aria-label="filled"
            className="plasmo-text-green-500 plasmo-flex plasmo-items-center plasmo-gap-2">
            <Check className="plasmo-w-5 plasmo-h-5 plasmo-animate-pulse" />
            <span className="plasmo-text-sm plasmo-text-green-600">
              Filled
              {dataSource === "generated" && " (AI Generated)"}
              {dataSource === "custom" && " (Custom Data)"}
            </span>
          </span>
        )}
        {status === "error" && (
          <span
            aria-label="error"
            className="plasmo-text-red-500 plasmo-flex plasmo-items-center plasmo-gap-2">
            <X className="plasmo-w-5 plasmo-h-5 plasmo-animate-pulse" />
            <span className="plasmo-text-sm plasmo-text-red-600">
              No Form Detected
            </span>
          </span>
        )}
        {status === "noform" && (
          <span
            aria-label="noform"
            className="plasmo-text-yellow-600 plasmo-flex plasmo-items-center plasmo-gap-2">
            <AlertCircle className="plasmo-w-5 plasmo-h-5" />
            <span className="plasmo-text-sm plasmo-text-yellow-700">
              No form detected
            </span>
          </span>
        )}
      </div>
    </section>
  )
}
