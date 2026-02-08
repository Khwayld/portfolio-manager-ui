// Core types matching backend contract (from CLAUDE.md)

export interface Portfolio {
  id: string
  userId: string
  name: string
  description: string | null
  baseCurrency: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface Holding {
  id: string
  portfolioId: string
  assetClass: AssetClass
  marketSource: string
  symbol: string | null
  name: string
  currency: string
  quantity: number
  avgCostPrice: number
  currentPrice: number | null
  acquisitionDate: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  holdingId: string
  portfolioId: string
  type: TransactionType
  date: string
  quantity: number
  price: number
  amount: number
  fee: number
  currency: string
  notes: string | null
  createdAt: string
}

export interface Deposit {
  id: string
  holdingId: string
  bankName: string
  accountNumber: string | null
  depositType: DepositType
  principal: number
  annualYieldPct: number
  compounding: Compounding
  maturityDate: string | null
  startDate: string
  currency: string
  isIslamic: boolean
  notes: string | null
  projectedYield?: number
}

export interface Property {
  id: string
  holdingId: string
  address: string
  propertyType: PropertyType
  purchasePrice: number
  currentValue: number
  areaSqm: number | null
  monthlyRent: number | null
  occupancyStatus: OccupancyStatus
  tenantName: string | null
  leaseStart: string | null
  leaseEnd: string | null
  currency: string
  notes: string | null
}

export interface RentalIncome {
  id: string
  propertyId: string
  month: string
  amount: number
  isReceived: boolean
  receivedDate: string | null
  notes: string | null
}

export interface PortfolioSnapshot {
  id: string
  portfolioId: string
  date: string
  totalValue: number
  totalCost: number
  gainLossPct: number
  createdAt: string
}

export interface Profile {
  id: string
  displayName: string | null
  baseCurrency: string
  createdAt: string
  updatedAt: string
}

// Auth
export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: { id: string; email: string }
}

export interface AuthUser {
  id: string
  email: string
}

// Analytics
export interface PortfolioSummary {
  totalValue: number
  totalCost: number
  totalGainLoss: number
  totalGainLossPct: number
  dayChange: number
  dayChangePct: number
}

export interface AllocationItem {
  label: string
  value: number
  percentage: number
  color: string
}

export interface PerformancePoint {
  date: string
  value: number
  returnPct: number
}

export interface SharpeResult {
  sharpeRatio: number
  annualizedReturn: number
  annualizedVolatility: number
  riskFreeRate: number
  period: string
}

export interface IncomeSummary {
  totalIncome: number
  dividends: number
  interest: number
  coupons: number
  rentalIncome: number
  depositYields: number
  byMonth: { month: string; amount: number }[]
}

export interface MarketQuote {
  symbol: string
  name: string
  price: number
  change: number
  changePct: number
  currency: string
  source: string
}

export interface PriceHistory {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// Enums
export type AssetClass = 'equity' | 'fixed_income' | 'commodity' | 'deposit' | 'real_estate' | 'cash'
export type TransactionType = 'buy' | 'sell' | 'dividend' | 'interest' | 'coupon' | 'rental_income' | 'deposit_yield' | 'fee' | 'transfer'
export type DepositType = 'savings' | 'term' | 'call'
export type Compounding = 'daily' | 'monthly' | 'quarterly' | 'annual'
export type PropertyType = 'apartment' | 'villa' | 'commercial' | 'land'
export type OccupancyStatus = 'occupied' | 'vacant' | 'partial'
export type MarketSource = 'boursa_kuwait' | 'saudi' | 'uae' | 'bahrain' | 'qatar' | 'us' | 'international' | 'manual'

// API Response envelope
export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: { total?: number; page?: number; pageSize?: number }
  error?: { code: string; message: string }
}
