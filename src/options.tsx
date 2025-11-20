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
import Account from "~pages/AccountPage"
import Dashboard from "~pages/dashboard"
import CustomFields from "~pages/dashboard/custom-fields"
import Login from "~pages/LoginPage"

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
    // Ensure default landing on /dashboard when opened without a hash
    if (
      window.location &&
      (!window.location.hash || window.location.hash === "#")
    ) {
      navigate("/dashboard", { replace: true })
    }

    chrome.storage.local.get("optionsNavigateTo", (res) => {
      const target = res?.optionsNavigateTo
      if (typeof target === "string" && target.length > 0) {
        navigate(target, { replace: true })
        chrome.storage.local.remove("optionsNavigateTo")
      }
    })
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
            {/* Default route - redirect to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/custom-fields" element={<CustomFields />} />
            <Route path="/account" element={<Account />} />
            <Route path="/login" element={<Login />} />
            {/* Catch-all route for unmatched paths */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </Router>
    </ErrorBoundary>
  )
}
