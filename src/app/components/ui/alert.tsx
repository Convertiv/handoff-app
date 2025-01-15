import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border-none px-4 py-3 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-[14px] [&>svg]:text-foreground [&>svg~*]:pl-7 [&>svg]:stroke-[1.5px] [&>svg]:h-4 [&>svg]:w-4 [&_a]:underline",
  {
    variants: {
      variant: {
        default: "bg-slate-50 text-gray-600 ring-slate-500/20 ring-1 ring-inset [&>svg]:text-gray-600",
        destructive:
          "bg-red-50 text-red-800 ring-red-500/20 ring-1 ring-inset dark:border-destructive [&>svg]:text-red-700",
        warning:
          "bg-yellow-50 text-yellow-800 ring-yellow-500/20 ring-1 ring-inset dark:border-destructive [&>svg]:text-yellow-800",
        info:
          "bg-blue-50 text-sky-800 ring-blue-500/20 ring-1 ring-inset dark:border-destructive [&>svg]:text-sky-700",
        green:
          "bg-green-50 text-green-800 ring-green-500/20 ring-1 ring-inset dark:border-destructive [&>svg]:text-green-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
