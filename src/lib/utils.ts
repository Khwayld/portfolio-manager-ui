import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | undefined | null, currency: string = "KWD"): string {
  if (amount == null) amount = 0
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "KWD" ? 3 : 2,
    maximumFractionDigits: currency === "KWD" ? 3 : 2,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatPercentage(value: number | undefined | null): string {
  if (value == null) return "0.00%"
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
}
