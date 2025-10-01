import { useState } from "react"

export const FillButton = () => {
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
      } else {
        setStatus("❌ Failed!")
      }
    } catch (error) {
      console.error("Autofill error:", error)
      setStatus("❌ Error!")
    }

    setTimeout(() => setStatus(""), 2000)
  }
  return (
    <section id="fill-button plasmo-flex ">
      <button
        className="plasmo-flex plasmo-justify-center plasmo-p-2 plasmo-w-full plasmo-px-4 plasmo-py-2 plasmo-bg-blue-500 plasmo-text-white plasmo-rounded hover:plasmo-bg-blue-600 plasmo-transition"
        onClick={handleClick}>
        AutoFill
      </button>
      <p className="plasmo-justify-center plasmo-flex">{status}</p>
    </section>
  )
}
