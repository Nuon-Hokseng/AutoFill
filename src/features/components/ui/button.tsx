import { clsx } from "clsx"
import * as React from "react"

//Extend native button props
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "accent"
  size?: "sm" | "md" | "lg"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { children, variant = "default", size = "md", className = "", ...props },
    ref
  ) => {
    // Base styles
    const baseClasses =
      "rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"

    // Variant styles
    const variantClasses = clsx({
      "bg-[#00BABB] text-white hover:bg-[#00A5A5]": variant === "default",
      "bg-transparent text-gray-800 hover:bg-gray-100": variant === "ghost",
      "bg-accent text-white hover:bg-accent/90": variant === "accent"
    })

    // Size styles
    const sizeClasses = clsx({
      "text-sm py-1 px-3": size === "sm",
      "text-md py-2 px-4": size === "md",
      "text-lg py-3 px-6": size === "lg"
    })

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
        {...props} // spreads native props including type, onClick, disabled
      >
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"
