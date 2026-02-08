import { useQuery } from "@tanstack/react-query"
import { analyticsApi } from "@/api/analytics.api"

export function usePortfolioSummary(portfolioId: string) {
  return useQuery({
    queryKey: ["analytics", "summary", portfolioId],
    queryFn: () => analyticsApi.getSummary(portfolioId),
    enabled: !!portfolioId,
  })
}

export function useAllocation(portfolioId: string, groupBy?: string) {
  return useQuery({
    queryKey: ["analytics", "allocation", portfolioId, groupBy],
    queryFn: () => analyticsApi.getAllocation(portfolioId, groupBy),
    enabled: !!portfolioId,
  })
}

export function usePerformance(portfolioId: string, period?: string) {
  return useQuery({
    queryKey: ["analytics", "performance", portfolioId, period],
    queryFn: () => analyticsApi.getPerformance(portfolioId, period),
    enabled: !!portfolioId,
  })
}

export function useSharpe(portfolioId: string) {
  return useQuery({
    queryKey: ["analytics", "sharpe", portfolioId],
    queryFn: () => analyticsApi.getSharpe(portfolioId),
    enabled: !!portfolioId,
  })
}
