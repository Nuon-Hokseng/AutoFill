"use client"

// import "~style.css"
import { useEffect, useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"

import { Button } from "~features/components/ui/button"
import { logout } from "~lib/authService"
import { supabase } from "~lib/supabaseClient"

export function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Check initial auth state
    async function checkAuth() {
      try {
        const {
          data: { user }
        } = await supabase.auth.getUser()
        setIsAuthenticated(!!user)
      } catch (error) {
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()

    // Listen for auth state changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user)
      setLoading(false)
    })

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      setIsAuthenticated(false)
      navigate("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }
  return (
    <header className="border-b bg-card">
      <div className="flex h-16 items-center px-6">
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#00BABB] flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">A</span>
          </div>
          <span className="text-xl font-semibold">AutoFiller</span>
        </NavLink>

        {/* <nav className="ml-8 flex gap-6">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors hover:text-[#00A5A5] ${
                isActive ? "text-[#00BABB]" : "text-muted-foreground"
              }`
            }>
            Profile Field
          </NavLink>
          <NavLink
            to="/dashboard/custom-fields"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors hover:text-[#00A5A5] ${
                isActive ? "text-[#00BABB]" : "text-muted-foreground"
              }`
            }>
            Custom Fields
          </NavLink>
        </nav> */}

        <div className="ml-auto flex items-center gap-3">
          {!loading && isAuthenticated && (
            <Button
              size="sm"
              className="border border-[#00BABB] text-[#00BABB] hover:bg-[#00BABB] hover:text-white"
              onClick={handleLogout}>
              Logout
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
