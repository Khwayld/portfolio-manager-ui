import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { portfoliosApi } from "@/api/portfolios.api"

export function usePortfolios() {
  return useQuery({
    queryKey: ["portfolios"],
    queryFn: portfoliosApi.list,
  })
}

export function usePortfolio(id: string) {
  return useQuery({
    queryKey: ["portfolios", id],
    queryFn: () => portfoliosApi.get(id),
    enabled: !!id,
  })
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: portfoliosApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["portfolios"] }),
  })
}

export function useDeletePortfolio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: portfoliosApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["portfolios"] }),
  })
}
