"use client"

// import "~style.css"
import { NavLink } from "react-router-dom"

import iconUrl from "~assets/icon.png"

export function Header() {
  return (
    <header className="border-b bg-card">
      <div className="flex h-16 items-center px-6">
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <img
            src={iconUrl}
            alt="FormGenie Logo"
            className="w-8 h-8 rounded-lg object-cover"
          />
          <span className="text-xl font-semibold">FormGenie</span>
        </NavLink>
      </div>
    </header>
  )
}
