import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { holdingsApi } from "@/api/holdings.api"
import type { AssetClass } from "@/types"

export function useHoldings(portfolioId: string, params?: { assetClass?: AssetClass; active?: boolean }) {
  return useQuery({
    queryKey: ["holdings", portfolioId, params],
    queryFn: () => holdingsApi.list(portfolioId, params),
    enabled: !!portfolioId,
  })
}

export function useHolding(id: string) {
  return useQuery({
    queryKey: ["holdings", id],
    queryFn: () => holdingsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateHolding(portfolioId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof holdingsApi.create>[1]) =>
      holdingsApi.create(portfolioId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["holdings", portfolioId] }),
  })
}
