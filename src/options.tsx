import "~style.css"
import { HashRouter as Router, Routes, Route } from "react-router-dom"
import { Header } from "~features/components/ui/header"
import Dashboard from "~pages/dashboard"
import CustomFields from "~pages/dashboard/custom-fields"
import Account from "~pages/AccountPage"
import Login from "~pages/LoginPage"


export default function Options() {
  return (
    <Router>
      <Header />
      <main className="p-6">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/custom-fields" element={<CustomFields />} />
          <Route path="/account" element={<Account />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </Router>
  )
}
