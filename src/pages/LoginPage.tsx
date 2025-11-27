// src/pages/LoginPage.tsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { login } from "~lib/authService"
import {
  syncProfileFromSupabase,
  syncWebsiteProfilesFromSupabase
} from "~lib/syncService"

import React = require("react")

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // This hook lets you change pages
  const navigate = useNavigate()

  // This function runs when the form is submitted
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault() // Stop the page from reloading
    setLoading(true)
    setError(null)

    try {
      // Login and get session with token
      const data = await login(email, password)

      // Store the access token in Chrome storage
      if (data.session?.access_token && data.user?.id) {
        await chrome.storage.local.set({
          auth_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          user_id: data.user.id
        })
        console.log("✅ Stored auth tokens:", {
          userId: data.user.id,
          hasToken: !!data.session.access_token
        })
      } else {
        console.error("❌ Missing session or user data")
      }

      setLoading(false)

      // Auto-sync from cloud after login (non-blocking)
      syncProfileFromSupabase().catch((err) =>
        console.warn("Failed to sync custom fields:", err)
      )
      syncWebsiteProfilesFromSupabase().catch((err) =>
        console.warn("Failed to sync website profiles:", err)
      )

      // Success! Send the user to the dashboard with a clean reload
      window.location.href = chrome.runtime.getURL("options.html#/dashboard")
    } catch (error: any) {
      setLoading(false)
      setError(error.message || "Login failed")
    }
  }

  return (
    <div className="flex justify-center items-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">Login</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Show error message if login fails */}
          {error && <div className="text-sm text-red-600">{error}</div>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 font-semibold text-white bg-[#00BABB] rounded-md disabled:bg-gray-400 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
