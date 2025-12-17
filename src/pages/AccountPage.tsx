import { CreditCard, Pencil } from "lucide-react"
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
import { getPaymentDetails } from "~lib/rateLimitService"
import { supabase } from "~lib/supabaseClient"

import React = require("react")

interface PaymentInfo {
  status: "PAID" | "PENDING" | "EXPIRED" | "NOT_FOUND" | "ERROR"
  expiresAt: string | null
  daysRemaining: number | null
}

export default function AccountPage() {
  const [loading, setLoading] = useState(true)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [loadingPayment, setLoadingPayment] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileUpdating, setProfileUpdating] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  const [passwordUpdating, setPasswordUpdating] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

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
    loadPaymentInfo()
  }, [])
  // The empty array [] means this runs only once

  const loadPaymentInfo = async () => {
    setLoadingPayment(true)
    try {
      const details = await getPaymentDetails()
      setPaymentInfo(details)
    } catch (error) {
      console.error("Error loading payment info:", error)
    } finally {
      setLoadingPayment(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileUpdating(true)
    setProfileMessage(null)

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`
        }
      })

      if (error) throw error

      setProfileMessage({
        type: "success",
        text: "Profile updated successfully!"
      })
      setIsEditingProfile(false)
    } catch (error: any) {
      console.error("Error updating profile:", error)
      setProfileMessage({
        type: "error",
        text: error.message || "Failed to update profile"
      })
    } finally {
      setProfileUpdating(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordUpdating(true)
    setPasswordMessage(null)

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "New passwords don't match"
      })
      setPasswordUpdating(false)
      return
    }

    // Validate password length
    if (newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "Password must be at least 6 characters"
      })
      setPasswordUpdating(false)
      return
    }

    try {
      // Verify current password by attempting to sign in
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user?.email) {
        throw new Error("No user found")
      }

      // Try to sign in with current password to verify
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })

      if (signInError) {
        throw new Error("Current password is incorrect")
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      setPasswordMessage({
        type: "success",
        text: "Password updated successfully!"
      })

      // Clear password fields
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      console.error("Error changing password:", error)
      setPasswordMessage({
        type: "error",
        text: error.message || "Failed to change password"
      })
    } finally {
      setPasswordUpdating(false)
    }
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
        {/* Payment Info Section */}
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Payment Information</CardTitle>
                <CardDescription>
                  Your subscription status and details
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingPayment ? (
              <div className="text-sm text-gray-600">
                Loading payment information...
              </div>
            ) : paymentInfo ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-xs text-gray-600 mb-2">Status</div>
                  <div
                    className={`text-lg font-semibold px-3 py-1.5 rounded inline-block ${
                      paymentInfo.status === "PAID"
                        ? "bg-green-100 text-green-700"
                        : paymentInfo.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-700"
                          : paymentInfo.status === "EXPIRED"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                    }`}>
                    {paymentInfo.status === "PAID"
                      ? "✓ Active"
                      : paymentInfo.status === "PENDING"
                        ? "⏳ Pending"
                        : paymentInfo.status === "EXPIRED"
                          ? "✗ Expired"
                          : "No Subscription"}
                  </div>
                </div>

                {paymentInfo.expiresAt && paymentInfo.status === "PAID" && (
                  <>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="text-xs text-gray-600 mb-2">
                        Expires On
                      </div>
                      <div className="text-lg font-semibold text-gray-800">
                        {new Date(paymentInfo.expiresAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          }
                        )}
                      </div>
                    </div>

                    {paymentInfo.daysRemaining !== null && (
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="text-xs text-gray-600 mb-2">
                          Days Remaining
                        </div>
                        <div
                          className={`text-2xl font-bold ${
                            paymentInfo.daysRemaining > 7
                              ? "text-green-600"
                              : paymentInfo.daysRemaining > 3
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}>
                          {paymentInfo.daysRemaining}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {paymentInfo.expiresAt && paymentInfo.status === "EXPIRED" && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-600 mb-2">Expired On</div>
                    <div className="text-lg font-semibold text-red-600">
                      {new Date(paymentInfo.expiresAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric"
                        }
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-center">
                  <Button
                    onClick={loadPaymentInfo}
                    className="bg-blue-600 hover:bg-blue-700 text-white">
                    Refresh Status
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Unable to load payment information
              </div>
            )}

            {paymentInfo?.status === "NOT_FOUND" && (
              <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
                <p className="text-sm text-gray-600">
                  No active subscription found. Upgrade to Premium for unlimited
                  access and advanced features!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Info Section */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Your personal details and email address
                </CardDescription>
              </div>
              {!isEditingProfile && (
                <Button
                  onClick={() => setIsEditingProfile(true)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-[#00BABB]">
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter first name"
                  readOnly={!isEditingProfile}
                  className={!isEditingProfile ? "bg-gray-100" : ""}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter last name"
                  readOnly={!isEditingProfile}
                  className={!isEditingProfile ? "bg-gray-100" : ""}
                  required
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

              {profileMessage && (
                <div
                  className={`text-sm ${
                    profileMessage.type === "success"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}>
                  {profileMessage.text}
                </div>
              )}

              {isEditingProfile && (
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={profileUpdating}
                    className="bg-[#00BABB] hover:bg-[#009999]">
                    {profileUpdating ? "Updating..." : "Update Profile"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setIsEditingProfile(false)
                      setProfileMessage(null)
                    }}
                    variant="ghost"
                    className="border border-gray-300">
                    Cancel
                  </Button>
                </div>
              )}
            </form>
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
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  required
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
                  required
                />
              </div>

              {passwordMessage && (
                <div
                  className={`text-sm ${
                    passwordMessage.type === "success"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}>
                  {passwordMessage.text}
                </div>
              )}

              <Button
                type="submit"
                disabled={passwordUpdating}
                className="bg-[#00BABB] hover:bg-[#009999]">
                {passwordUpdating ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Danger Zone Section */}
      </main>
    </div>
  )
}
