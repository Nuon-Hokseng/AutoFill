"use client"
// import "~style.css"
import { NavLink } from "react-router-dom"
import { Button } from "~features/components/ui/button"
<<<<<<< HEAD

=======
import React = require("react")
>>>>>>> seng
export function Header() {
  return (
    <header className="border-b bg-card">
      <div className="flex h-16 items-center px-6">
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#00BABB] flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">A</span>
          </div>
          <span className="text-xl font-semibold">AutoFiller</span>
        </NavLink>

        <nav className="ml-8 flex gap-6">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors hover:text-[#00A5A5] ${
                isActive ? "text-[#00BABB]" : "text-muted-foreground"
              }`
            }
          >
            Profile Field
          </NavLink>
          <NavLink
            to="/dashboard/custom-fields"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors hover:text-[#00A5A5] ${
                isActive ? "text-[#00BABB]" : "text-muted-foreground"
              }`
            }
          >
            Custom Fields
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <NavLink to="/account">
            <Button variant="ghost" size="sm">
              Account
            </Button>
          </NavLink>
          <NavLink to="/login">
            <Button size="sm" className="bg-[#00BABB] hover:bg-[#00A5A5]">
              Login
            </Button>
          </NavLink>
        </div>
      </div>
    </header>
  )
}
