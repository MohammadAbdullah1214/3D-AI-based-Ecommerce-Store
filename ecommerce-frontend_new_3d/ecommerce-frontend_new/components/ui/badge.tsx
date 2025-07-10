import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-green-500 dark:bg-green-400 text-white dark:text-gray-900 hover:bg-green-600 dark:hover:bg-green-500",
        warning: "border-transparent bg-yellow-500 dark:bg-yellow-400 text-white dark:text-gray-900 hover:bg-yellow-600 dark:hover:bg-yellow-500",
        info: "border-transparent bg-blue-500 dark:bg-blue-400 text-white dark:text-gray-900 hover:bg-blue-600 dark:hover:bg-blue-500",
        primary: "border-transparent bg-blue-600 dark:bg-blue-400 text-white dark:text-gray-900 hover:bg-blue-700 dark:hover:bg-blue-500",
        accent: "border-transparent bg-purple-500 dark:bg-purple-400 text-white dark:text-gray-900 hover:bg-purple-600 dark:hover:bg-purple-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
