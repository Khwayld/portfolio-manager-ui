import { api } from "./client"
import type { Property, RentalIncome } from "@/types"

export const realEstateApi = {
  listProperties: (portfolioId: string) =>
    api.get<Property[]>(`/api/portfolios/${portfolioId}/properties`),
  createProperty: (portfolioId: string, data: Partial<Property> & { name: string }) =>
    api.post<Property>(`/api/portfolios/${portfolioId}/properties`, data),
  updateProperty: (id: string, data: Partial<Property>) =>
    api.patch<Property>(`/api/properties/${id}`, data),
  deleteProperty: (id: string) => api.delete(`/api/properties/${id}`),
  getIncome: (propertyId: string, year?: number) => {
    const qs = year ? `?year=${year}` : ""
    return api.get<RentalIncome[]>(`/api/properties/${propertyId}/income${qs}`)
  },
  recordIncome: (propertyId: string, data: Partial<RentalIncome>) =>
    api.post<RentalIncome>(`/api/properties/${propertyId}/income`, data),
}
