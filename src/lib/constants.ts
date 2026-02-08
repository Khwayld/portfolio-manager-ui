import type { AssetClass } from "@/types"

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  equity: "Equities",
  fixed_income: "Fixed Income",
  commodity: "Commodities",
  deposit: "Deposits",
  real_estate: "Real Estate",
  cash: "Cash / FX",
}

export const ASSET_CLASS_COLORS: Record<AssetClass, string> = {
  equity: "#3B82F6",
  fixed_income: "#8B5CF6",
  commodity: "#F59E0B",
  deposit: "#10B981",
  real_estate: "#EC4899",
  cash: "#6366F1",
}

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  buy: "Buy",
  sell: "Sell",
  dividend: "Dividend",
  interest: "Interest",
  coupon: "Coupon",
  rental_income: "Rental Income",
  deposit_yield: "Deposit Yield",
  fee: "Fee",
  transfer: "Transfer",
}

export const CURRENCIES = ["KWD", "USD", "EUR", "GBP", "SAR", "AED", "BHD", "QAR"] as const
