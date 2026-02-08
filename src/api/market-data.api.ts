import { api } from "./client"
import type { MarketQuote, PriceHistory } from "@/types"

export const marketDataApi = {
  search: (q: string, source?: string) => {
    const params = new URLSearchParams({ q })
    if (source) params.set("source", source)
    return api.get<{ symbol: string; name: string; exchange: string; assetType: string }[]>(
      `/api/market/search?${params}`
    )
  },
  getPrice: (symbol: string, source?: string) => {
    const qs = source ? `?source=${source}` : ""
    return api.get<MarketQuote>(`/api/market/price/${symbol}${qs}`)
  },
  getHistory: (symbol: string, params?: { source?: string; from?: string; to?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.source) searchParams.set("source", params.source)
    if (params?.from) searchParams.set("from", params.from)
    if (params?.to) searchParams.set("to", params.to)
    const qs = searchParams.toString()
    return api.get<PriceHistory[]>(`/api/market/history/${symbol}${qs ? `?${qs}` : ""}`)
  },
  getFundamentals: (symbol: string, source?: string) => {
    const qs = source ? `?source=${source}` : ""
    return api.get<Record<string, unknown>>(`/api/market/fundamentals/${symbol}${qs}`)
  },
  getFxRates: (base?: string, quotes?: string[]) => {
    const params = new URLSearchParams()
    if (base) params.set("base", base)
    if (quotes) params.set("quotes", quotes.join(","))
    return api.get<{ pair: string; rate: number; timestamp: string }[]>(
      `/api/market/fx?${params}`
    )
  },
  getCommodities: (symbols?: string[]) => {
    const qs = symbols ? `?symbols=${symbols.join(",")}` : ""
    return api.get<MarketQuote[]>(`/api/market/commodities${qs}`)
  },
  getBonds: () =>
    api.get<{ symbol: string; name: string; yieldPct: number; change: number }[]>(
      "/api/market/bonds"
    ),
}
