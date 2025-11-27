"use client"

// import "~style.css"
import { NavLink } from "react-router-dom"

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
      </div>
    </header>
  )
}
