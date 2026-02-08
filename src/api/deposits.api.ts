import { api } from "./client"
import type { Deposit } from "@/types"

export const depositsApi = {
  list: (portfolioId: string) =>
    api.get<Deposit[]>(`/api/portfolios/${portfolioId}/deposits`),
  create: (portfolioId: string, data: Partial<Deposit> & { name: string }) =>
    api.post<Deposit>(`/api/portfolios/${portfolioId}/deposits`, data),
  update: (id: string, data: Partial<Deposit>) =>
    api.patch<Deposit>(`/api/deposits/${id}`, data),
  delete: (id: string) => api.delete(`/api/deposits/${id}`),
}
