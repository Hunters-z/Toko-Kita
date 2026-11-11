import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[70px] w-full rounded-xl border border-line bg-white px-3.5 py-2 text-[14px] text-ink placeholder:text-dim focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-[#EAF0FE] disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  />
))
Textarea.displayName = "Textarea"

export { Textarea }
