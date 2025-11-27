import { useEffect, useState } from "react" // <-- 1. Added useEffect

import "~style.css"

import { Button } from "~features/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "~features/components/ui/card"
import { Input } from "~features/components/ui/input"
import { Label } from "~features/components/ui/label"
import { supabase } from "~lib/supabaseClient"

import React = require("react")

export default function AccountPage() {
  const [loading, setLoading] = useState(true)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    async function fetchUserData() {
      setLoading(true)

      try {
        const {
          data: { user }
        } = await supabase.auth.getUser()

        if (user) {
          setEmail(user.email)
          setFirstName(user.user_metadata?.first_name || "")
          setLastName(user.user_metadata?.last_name || "")
        } else {
          console.log("No user is logged in.")
          setEmail("")
          setFirstName("")
          setLastName("")
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        setEmail("")
        setFirstName("")
        setLastName("")
      }

      setLoading(false)
    }

    fetchUserData()
  }, [])
  // The empty array [] means this runs only once

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    // This is where you would add Supabase logic to UPDATE the name
    console.log("Profile updated:", { firstName, lastName, email })
  }

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      alert("Passwords don't match")
      return
    }
    console.log("Password changed")
  }

  // 5. Added a loading state to prevent showing old data
  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <header className="p-4 mx-32">
          <h1 className="text-3xl font-bold">Loading Account...</h1>
        </header>
      </div>
    )
  }

  // 6. Your original JSX. The 'value' props will now use the fetched data.
  return (
    <div className="min-h-screen bg-white">
      <header className="p-4 px-4 sm:px-8 md:px-16 lg:px-32">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Account Settings</h1>
          <Button
            onClick={async () => {
              try {
                const { logout } = await import("~lib/authService")
                await logout()
                window.location.href = chrome.runtime.getURL(
                  "options.html#/login"
                )
              } catch (error) {
                console.error("Logout error:", error)
              }
            }}
            variant="ghost"
            className="border border-red-300 text-red-600 hover:bg-red-50">
            Logout
          </Button>
        </div>
      </header>

      <main className="p-4 px-4 sm:px-8 md:px-16 lg:px-32 max-w-7xl mx-auto space-y-6">
        {/* Profile Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Your personal details and email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName || "No first name set"}
                  readOnly
                  className="bg-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName || "No last name set"}
                  readOnly
                  className="bg-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email || "Not logged in"}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password Section */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Danger Zone Section */}
      </main>
    </div>
  )
}
