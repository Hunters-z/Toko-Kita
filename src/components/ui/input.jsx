import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-10 w-full rounded-xl border border-line bg-white px-3.5 py-2 text-[14px] text-ink shadow-none transition-colors placeholder:text-dim focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-[#EAF0FE] disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  />
))
Input.displayName = "Input"

export { Input }
