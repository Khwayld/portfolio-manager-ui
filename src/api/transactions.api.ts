import { api } from "./client"
import type { Transaction } from "@/types"

export const transactionsApi = {
  list: (portfolioId: string, params?: {
    holdingId?: string; type?: string; startDate?: string; endDate?: string; page?: number; pageSize?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.holdingId) searchParams.set("holdingId", params.holdingId)
    if (params?.type) searchParams.set("type", params.type)
    if (params?.startDate) searchParams.set("startDate", params.startDate)
    if (params?.endDate) searchParams.set("endDate", params.endDate)
    if (params?.page) searchParams.set("page", String(params.page))
    if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize))
    const qs = searchParams.toString()
    return api.get<Transaction[]>(`/api/portfolios/${portfolioId}/transactions${qs ? `?${qs}` : ""}`)
  },
  create: (portfolioId: string, data: Partial<Transaction>) =>
    api.post<Transaction>(`/api/portfolios/${portfolioId}/transactions`, data),
  delete: (id: string) => api.delete(`/api/transactions/${id}`),
}
