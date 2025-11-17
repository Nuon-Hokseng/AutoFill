import * as React from "react"

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  // you can extend with your own variants if needed later
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`text-sm font-medium leading-none ${className || ""}`}
        {...props}
      >
        {children}
      </label>
    )
  }
)

Label.displayName = "Label"
