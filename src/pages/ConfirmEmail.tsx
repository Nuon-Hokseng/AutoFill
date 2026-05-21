// src/pages/ConfirmEmail.tsx
import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { supabase } from "~lib/supabaseClient"

import React = require("react")

export default function ConfirmEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  )
  const [message, setMessage] = useState("")

  useEffect(() => {
    const confirmEmail = async () => {
      const tokenHash = searchParams.get("token_hash")
      const type = searchParams.get("type")

      if (!tokenHash || type !== "email") {
        setStatus("error")
        setMessage("Invalid confirmation link")
        return
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "email"
        })

        if (error) {
          setStatus("error")
          setMessage(error.message || "Failed to confirm email")
        } else {
          setStatus("success")
          setMessage("Email confirmed successfully! Redirecting to login...")
          setTimeout(() => {
            navigate("/login")
          }, 2000)
        }
      } catch (err: any) {
        setStatus("error")
        setMessage(err.message || "An error occurred")
      }
    }

    confirmEmail()
  }, [searchParams, navigate])

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold">Email Confirmation</h2>

        {status === "loading" && (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00BABB] mx-auto"></div>
            <p className="text-gray-600">Confirming your email...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="text-green-500 text-5xl">✓</div>
            <p className="text-green-600 font-medium">{message}</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="text-red-500 text-5xl">✗</div>
            <p className="text-red-600 font-medium">{message}</p>
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 text-white bg-[#00BABB] rounded-md hover:bg-[#009999]">
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
