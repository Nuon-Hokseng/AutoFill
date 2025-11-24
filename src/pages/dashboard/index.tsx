<<<<<<< HEAD
import React from "react"

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
    </div>
  )
}
=======
import { Calendar, FileText, Globe, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "~features/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "~features/components/ui/card"

import React = require("react")

interface ProfileEntry {
  id: string
  website: string
  url: string
  timestamp: number
  data: Record<string, string>
  filledFields: string[]
}

export default function Dashboard() {
  const [profiles, setProfiles] = useState<ProfileEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load website profiles from storage
    chrome.storage.local.get("websiteProfiles", (res) => {
      const savedProfiles = res.websiteProfiles || []
      setProfiles(
        savedProfiles.sort(
          (a: ProfileEntry, b: ProfileEntry) => b.timestamp - a.timestamp
        )
      )
      setLoading(false)
    })
  }, [])

  const handleDelete = (profileId: string) => {
    const updated = profiles.filter((p) => p.id !== profileId)
    chrome.storage.local.set({ websiteProfiles: updated }, () => {
      setProfiles(updated)
    })
  }

  const handleClearAll = () => {
    if (confirm("Are you sure you want to delete all website profiles?")) {
      chrome.storage.local.set({ websiteProfiles: [] }, () => {
        setProfiles([])
      })
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace("www.", "")
    } catch {
      return url
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="p-4 mx-32">
          <h1 className="text-3xl font-bold">Loading...</h1>
        </header>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="p-4 mx-32 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Website Profiles</h1>
          <p className="text-gray-600 mt-2">
            Manage your saved autofill profiles for different websites
          </p>
        </div>
        {profiles.length > 0 && (
          <Button
            onClick={handleClearAll}
            variant="ghost"
            className="border border-red-300 text-red-600 hover:bg-red-50">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        )}
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        {profiles.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <Globe className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No Website Profiles Yet
                </h3>
                <p className="text-gray-600 max-w-md">
                  Start using the autofill extension on websites to
                  automatically save profiles here. Each profile stores the data
                  you've filled in for easy reuse.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => (
              <Card
                key={profile.id}
                className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">
                          {getDomain(profile.url)}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 text-xs">
                          <Calendar className="w-3 h-3" />
                          {formatDate(profile.timestamp)}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDelete(profile.id)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span>
                        {profile.filledFields.length} field
                        {profile.filledFields.length !== 1 ? "s" : ""} saved
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {profile.filledFields.slice(0, 5).map((field) => (
                        <span
                          key={field}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {field}
                        </span>
                      ))}
                      {profile.filledFields.length > 5 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          +{profile.filledFields.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
>>>>>>> seng
