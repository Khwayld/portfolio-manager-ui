import { api } from "./client"
import type { PortfolioSummary, AllocationItem, PerformancePoint, SharpeResult, IncomeSummary } from "@/types"

export const analyticsApi = {
  getSummary: (portfolioId: string) =>
    api.get<PortfolioSummary>(`/api/portfolios/${portfolioId}/analytics/summary`),
  getAllocation: (portfolioId: string, groupBy?: string) => {
    const qs = groupBy ? `?groupBy=${groupBy}` : ""
    return api.get<AllocationItem[]>(`/api/portfolios/${portfolioId}/analytics/allocation${qs}`)
  },
  getPerformance: (portfolioId: string, period?: string, interval?: string) => {
    const params = new URLSearchParams()
    if (period) params.set("period", period)
    if (interval) params.set("interval", interval)
    const qs = params.toString()
    return api.get<PerformancePoint[]>(
      `/api/portfolios/${portfolioId}/analytics/performance${qs ? `?${qs}` : ""}`
    )
  },
  getSharpe: (portfolioId: string, period?: string, riskFreeRate?: number) => {
    const params = new URLSearchParams()
    if (period) params.set("period", period)
    if (riskFreeRate !== undefined) params.set("riskFreeRate", String(riskFreeRate))
    const qs = params.toString()
    return api.get<SharpeResult>(
      `/api/portfolios/${portfolioId}/analytics/sharpe${qs ? `?${qs}` : ""}`
    )
  },
  getIncome: (portfolioId: string, year?: number) => {
    const qs = year ? `?year=${year}` : ""
    return api.get<IncomeSummary>(`/api/portfolios/${portfolioId}/analytics/income${qs}`)
  },
}
