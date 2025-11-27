import "~style.css"
import { HashRouter as Router, Routes, Route } from "react-router-dom"
import { Header } from "~features/components/ui/header"
import Dashboard from "~pages/dashboard"
import CustomFields from "~pages/dashboard/custom-fields"
import Account from "~pages/AccountPage"
import Login from "~pages/LoginPage"



import {
  Navigate,
  Route,
  HashRouter as Router,
  Routes,
  useNavigate
} from "react-router-dom"

import { Header } from "~features/components/ui/header"
import { supabase } from "~lib/supabaseClient"
import Account from "~pages/AccountPage"
import ConfirmEmail from "~pages/ConfirmEmail"
import Dashboard from "~pages/dashboard"
import CustomFields from "~pages/dashboard/custom-fields"
import WebsiteProfiles from "~pages/dashboard/website-profiles"
import Login from "~pages/LoginPage"
import SignupPage from "~pages/SignupPage"

import React = require("react")

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: any }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }
  componentDidCatch(error: any, info: any) {
    console.error("Options page error:", error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, fontFamily: "sans-serif" }}>
          <h2>Something went wrong loading Options.</h2>
          <p>Open DevTools (Ctrl+Shift+I) and check the Console.</p>
          {this.state.error && (
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {String(this.state.error)}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}

// Ensures deep links from popup (via storage hint) land on /dashboard
function OptionsRouteInitializer() {
  const navigate = useNavigate()

  React.useEffect(() => {
    // Default landing should depend on auth; guard deep-linking too
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      const isAuthed = !!data?.session

      if (
        window.location &&
        (!window.location.hash || window.location.hash === "#")
      ) {
        navigate(isAuthed ? "/dashboard" : "/signup", { replace: true })
      }

      chrome.storage.local.get("optionsNavigateTo", (res) => {
        let target = res?.optionsNavigateTo as string | undefined
        if (typeof target === "string" && target.length > 0) {
          // If not authed, prevent direct navigation to protected routes
          if (
            !isAuthed &&
            (target.startsWith("/dashboard") || target.startsWith("/account"))
          ) {
            target = "/signup"
          }
          navigate(target, { replace: true })
          chrome.storage.local.remove("optionsNavigateTo")
        }
      })
    }

    init()
  }, [navigate])

  return null
}

export default function Options() {
  return (
    <ErrorBoundary>
      <Router>
        <OptionsRouteInitializer />
        <Header />
        <main className="p-6">
          <Routes>
            {/* Default route - unauthenticated users go to signup */}
            <Route path="/" element={<Navigate to="/signup" replace />} />
            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/dashboard/custom-fields"
              element={
                <RequireAuth>
                  <CustomFields />
                </RequireAuth>
              }
            />
            <Route
              path="/dashboard/website-profiles"
              element={
                <RequireAuth>
                  <WebsiteProfiles />
                </RequireAuth>
              }
            />
            <Route
              path="/account"
              element={
                <RequireAuth>
                  <Account />
                </RequireAuth>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/auth/confirm" element={<ConfirmEmail />} />
            {/* Catch-all route for unmatched paths */}
            <Route path="*" element={<Navigate to="/signup" replace />} />
          </Routes>
        </main>
      </Router>
    </ErrorBoundary>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = React.useState(true)
  const [authed, setAuthed] = React.useState(false)

  React.useEffect(() => {
    let unsub: any
    const run = async () => {
      const { data } = await supabase.auth.getSession()
      setAuthed(!!data?.session)
      setChecking(false)
      const { data: listener } = supabase.auth.onAuthStateChange(
        (_e, session) => {
          setAuthed(!!session)
        }
      )
      unsub = () => listener.subscription.unsubscribe()
    }
    run()
    return () => {
      try {
        if (typeof unsub === "function") unsub()
      } catch {}
    }
  }, [])

  if (checking) return null
  return authed ? <>{children}</> : <Navigate to="/signup" replace />
}
