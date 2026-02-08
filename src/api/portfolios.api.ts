import { api } from "./client"
import type { Portfolio } from "@/types"

export const portfoliosApi = {
  list: () => api.get<Portfolio[]>("/api/portfolios"),
  get: (id: string) => api.get<Portfolio>(`/api/portfolios/${id}`),
  create: (data: { name: string; description?: string; baseCurrency?: string; isDefault?: boolean }) =>
    api.post<Portfolio>("/api/portfolios", data),
  update: (id: string, data: Partial<Portfolio>) =>
    api.patch<Portfolio>(`/api/portfolios/${id}`, data),
  delete: (id: string) => api.delete(`/api/portfolios/${id}`),
}
