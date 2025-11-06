import React, { useState } from "react"
import "~style.css"
import { Button } from "~features/components/ui/button"
import { Input } from "~features/components/ui/input"
import { Label } from "~features/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~features/components/ui/card"

export default function AccountPage() {
  const [name, setName] = useState("Lina")
  const [email, setEmail] = useState("example@gmail.com")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Profile updated:", { name, email })
  }

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      alert("Passwords don't match")
      return
    }
    console.log("Password changed")
  }

  return (
    <div className="min-h-screen bg-white">
      

      <header className="p-4 mx-32">
        <h1 className="text-3xl font-bold">Account Settings</h1>
      </header>

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Profile Info Section */}
        <Card>
  <CardHeader>
    <CardTitle>Profile Information</CardTitle>
    <CardDescription>Your personal details and email address</CardDescription>
  </CardHeader>
  <CardContent>
    {/* We removed the <form> wrapper and the <Button> */}
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          readOnly 
          className="bg-gray-100" 
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
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
            <CardDescription>Update your password to keep your account secure</CardDescription>
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
