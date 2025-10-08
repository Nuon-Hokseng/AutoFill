import { RefreshCw, Wand2 } from "lucide-react"
import { useState } from "react"

type FillResult = { filled?: number; total?: number } | null

export const FillButton = ({
  onResult
}: {
  onResult?: (r: FillResult) => void
}) => {
  const [status, setStatus] = useState("")

  const handleClick = async () => {
    try {
      setStatus("Filling...")
      const response = await chrome.runtime.sendMessage({
        type: "TRIGGER_AUTOFILL",
        action: "fillCredentials"
      })

      if (response?.success) {
        setStatus("✅ Filled!")
        if (onResult)
          onResult({ filled: response.filled ?? 0, total: response.total ?? 0 })
      } else {
        setStatus("❌ Failed!")
        if (onResult) onResult({ filled: 0, total: 0 })
      }
    } catch (error) {
      console.error("Autofill error:", error)
      setStatus("❌ Error!")
      if (onResult) onResult({ filled: 0, total: 0 })
    }

    setTimeout(() => setStatus(""), 2000)
  }
  return (
    <section id="fill-button plasmo-flex ">
      <button
        className="plasmo-text-lg plasmo-flex plasmo-items-center plasmo-justify-center plasmo-gap-2 plasmo-p-2 plasmo-w-full plasmo-px-4 plasmo-py-2 plasmo-bg-blue-500 plasmo-text-white plasmo-rounded hover:plasmo-bg-blue-600 plasmo-transition"
        onClick={handleClick}>
        {status === "Filling..." ? (
          <>
            <RefreshCw className="plasmo-w-4 plasmo-h-4 plasmo-animate-spin" />
            <span>Auto Filling...</span>
          </>
        ) : (
          <>
            <Wand2 className="plasmo-w-4 plasmo-h-4" />
            <span>AutoFill</span>
          </>
        )}
      </button>
      <p className="plasmo-justify-center plasmo-flex">{status}</p>
    </section>
  )
}
