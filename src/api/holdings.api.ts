import { api } from "./client"
import type { Holding, AssetClass } from "@/types"

export const holdingsApi = {
  list: (portfolioId: string, params?: { assetClass?: AssetClass; active?: boolean }) => {
    const searchParams = new URLSearchParams()
    if (params?.assetClass) searchParams.set("assetClass", params.assetClass)
    if (params?.active !== undefined) searchParams.set("active", String(params.active))
    const qs = searchParams.toString()
    return api.get<Holding[]>(`/api/portfolios/${portfolioId}/holdings${qs ? `?${qs}` : ""}`)
  },
  get: (id: string) => api.get<Holding>(`/api/holdings/${id}`),
  create: (portfolioId: string, data: Partial<Holding>) =>
    api.post<Holding>(`/api/portfolios/${portfolioId}/holdings`, data),
  update: (id: string, data: Partial<Holding>) =>
    api.patch<Holding>(`/api/holdings/${id}`, data),
  delete: (id: string) => api.delete(`/api/holdings/${id}`),
}
