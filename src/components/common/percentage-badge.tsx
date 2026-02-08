import { cn } from "@/lib/utils"
import { formatPercentage } from "@/lib/utils"

interface PercentageBadgeProps {
  value: number
  className?: string
}

export function PercentageBadge({ value, className }: PercentageBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
        value > 0 && "bg-emerald-50 text-emerald-700",
        value < 0 && "bg-red-50 text-red-700",
        value === 0 && "bg-gray-50 text-gray-700",
        className
      )}
    >
      {formatPercentage(value)}
    </span>
  )
}
