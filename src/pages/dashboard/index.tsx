import { Calendar, FileText, Globe, Settings, Trash2, User } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import CustomTab from "~components/custom-tab"
import { Button } from "~features/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "~features/components/ui/card"

interface ProfileEntry {
  id: string
  website: string
  url: string
  timestamp: number
  data: Record<string, string>
  filledFields: string[]
}

export default function Dashboard() {
  const navigate = useNavigate()
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
      <header className="p-4 px-4 sm:px-8 md:px-16 lg:px-32">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Manage your autofill data and profiles
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 mb-8">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/account")}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">
                    Account
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Settings and preferences
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </header>

      <main className="p-4 px-4 sm:px-8 md:px-16 lg:px-32 max-w-7xl mx-auto">
        {/* Custom Fields Section */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">Custom Fields</h2>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">
              Manage your personal autofill data
            </p>
          </div>
          <div className="flex justify-center">
            <CustomTab goBack={() => {}} mode="web" />
          </div>
        </section>

        {/* Website Profiles Section */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">
                Recent Website Profiles
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm mt-1">
                Autofill history from websites you've visited
              </p>
            </div>
            {profiles.length > 0 && (
              <Button
                onClick={handleClearAll}
                variant="ghost"
                className="border border-red-300 text-red-600 hover:bg-red-50 text-sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
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
                    automatically save profiles here. Each profile stores the
                    data you've filled in for easy reuse.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        </section>
      </main>
    </div>
  )
}
