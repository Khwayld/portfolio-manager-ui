import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface CurrencyDisplayProps {
  amount: number
  currency?: string
  className?: string
  colored?: boolean
}

export function CurrencyDisplay({ amount, currency = "KWD", className, colored }: CurrencyDisplayProps) {
  return (
    <span
      className={cn(
        "font-medium tabular-nums",
        colored && amount > 0 && "text-emerald-600",
        colored && amount < 0 && "text-red-600",
        className
      )}
    >
      {formatCurrency(amount, currency)}
    </span>
  )
}
