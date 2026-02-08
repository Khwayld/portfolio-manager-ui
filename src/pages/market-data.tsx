import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { marketDataApi } from "@/api/market-data.api"
import { cn, formatCurrency, formatDate, formatPercentage } from "@/lib/utils"
import type { MarketQuote, PriceHistory } from "@/types"

type Period = "1d" | "1w" | "1m" | "qtr" | "1y" | "ytd" | "all"

const PERIODS: { value: Period; label: string }[] = [
  { value: "1d", label: "1D" },
  { value: "1w", label: "1W" },
  { value: "1m", label: "1M" },
  { value: "qtr", label: "QTR" },
  { value: "1y", label: "1Y" },
  { value: "ytd", label: "YTD" },
  { value: "all", label: "ALL" },
]

function getDateRange(period: Period): { from?: string; to?: string } {
  const now = new Date()
  const to = now.toISOString().split("T")[0]

  switch (period) {
    case "1d": {
      const d = new Date(now)
      d.setDate(d.getDate() - 1)
      return { from: d.toISOString().split("T")[0], to }
    }
    case "1w": {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      return { from: d.toISOString().split("T")[0], to }
    }
    case "1m": {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 1)
      return { from: d.toISOString().split("T")[0], to }
    }
    case "qtr": {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 3)
      return { from: d.toISOString().split("T")[0], to }
    }
    case "1y": {
      const d = new Date(now)
      d.setFullYear(d.getFullYear() - 1)
      return { from: d.toISOString().split("T")[0], to }
    }
    case "ytd": {
      return { from: `${now.getFullYear()}-01-01`, to }
    }
    case "all":
      return { from: "2000-01-01", to }
  }
}

export default function MarketDataPage() {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [selectedSource, setSelectedSource] = useState<string | undefined>(undefined)
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("1y")

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  // Search query
  const {
    data: searchResults,
    isLoading: searchLoading,
    error: searchError,
  } = useQuery({
    queryKey: ["market-search", debouncedQuery],
    queryFn: () => marketDataApi.search(debouncedQuery),
    enabled: !!debouncedQuery,
  })

  // Selected stock price
  const {
    data: selectedQuote,
    isLoading: quoteLoading,
    error: quoteError,
  } = useQuery({
    queryKey: ["market-price", selectedSymbol, selectedSource],
    queryFn: () => marketDataApi.getPrice(selectedSymbol!, selectedSource),
    enabled: !!selectedSymbol,
  })

  // Selected stock history for mini chart
  const dateRange = getDateRange(selectedPeriod)
  const {
    data: priceHistory,
    isLoading: historyLoading,
  } = useQuery({
    queryKey: ["market-history", selectedSymbol, selectedPeriod, selectedSource],
    queryFn: () => marketDataApi.getHistory(selectedSymbol!, { ...dateRange, source: selectedSource }),
    enabled: !!selectedSymbol,
  })

  // Commodities
  const {
    data: commodities,
    isLoading: commoditiesLoading,
    error: commoditiesError,
  } = useQuery({
    queryKey: ["commodities"],
    queryFn: () => marketDataApi.getCommodities(),
  })

  // FX Rates
  const {
    data: fxRates,
    isLoading: fxLoading,
    error: fxError,
  } = useQuery({
    queryKey: ["fx-rates"],
    queryFn: () => marketDataApi.getFxRates(),
  })

  // Bond Yields
  const {
    data: bonds,
    isLoading: bondsLoading,
    error: bondsError,
  } = useQuery({
    queryKey: ["bonds"],
    queryFn: () => marketDataApi.getBonds(),
  })

  const renderLoadingSpinner = () => (
    <div className="flex items-center justify-center py-8">
      <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )

  const renderError = (message: string) => (
    <p className="text-sm text-destructive py-4">{message}</p>
  )

  const handleResultClick = (symbol: string, source?: string) => {
    setSelectedSymbol(symbol)
    setSelectedSource(source === "boursa_kuwait" ? "boursa_kuwait" : undefined)
    setSelectedPeriod("1y")
  }

  return (
    <div>
      <PageHeader
        title="Market Data"
        description="Search stocks, commodities, FX rates, and bonds"
      />

      <div className="space-y-6">
        {/* Search section */}
        <div className="space-y-4">
          <Input
            placeholder="Search by symbol or name (e.g., AAPL, NBK.KW, GC=F)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {/* Search results */}
          {debouncedQuery && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Search Results</CardTitle>
              </CardHeader>
              <CardContent>
                {searchLoading ? (
                  renderLoadingSpinner()
                ) : searchError ? (
                  renderError("Failed to search. Please try again.")
                ) : !searchResults || searchResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    No results found for "{debouncedQuery}"
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Exchange</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResults.map((result: any, i: number) => (
                        <TableRow
                          key={`${result.symbol}-${i}`}
                          className="cursor-pointer"
                          onClick={() => handleResultClick(result.symbol, result.source)}
                        >
                          <TableCell className="font-medium">
                            {result.symbol}
                          </TableCell>
                          <TableCell>{result.name}</TableCell>
                          <TableCell>{result.exchange}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{result.assetType}</Badge>
                          </TableCell>
                          <TableCell>
                            {result.source && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  result.source === "boursa_kuwait"
                                    ? "bg-amber-100 text-amber-800 border-amber-300"
                                    : "bg-blue-100 text-blue-800 border-blue-300"
                                )}
                              >
                                {result.source === "boursa_kuwait" ? "Boursa" : "Yahoo"}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Selected stock details */}
        {selectedSymbol && (
          <Card>
            <CardHeader>
              <CardTitle>
                {quoteLoading
                  ? selectedSymbol
                  : selectedQuote
                    ? `${selectedQuote.name} (${selectedQuote.symbol})`
                    : selectedSymbol}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {quoteLoading ? (
                renderLoadingSpinner()
              ) : quoteError ? (
                renderError("Failed to load price data.")
              ) : selectedQuote ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-baseline gap-4">
                    <span className="text-3xl font-bold tabular-nums">
                      {formatCurrency(selectedQuote.price, selectedQuote.currency)}
                    </span>
                    <span
                      className={cn(
                        "text-lg font-medium tabular-nums",
                        selectedQuote.change > 0 && "text-emerald-600",
                        selectedQuote.change < 0 && "text-red-600"
                      )}
                    >
                      {selectedQuote.change > 0 ? "+" : ""}
                      {selectedQuote.change.toFixed(2)}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md px-2 py-1 text-sm font-medium",
                        selectedQuote.changePct > 0 && "bg-emerald-50 text-emerald-700",
                        selectedQuote.changePct < 0 && "bg-red-50 text-red-700",
                        selectedQuote.changePct === 0 && "bg-gray-50 text-gray-700"
                      )}
                    >
                      {formatPercentage(selectedQuote.changePct)}
                    </span>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Currency: {selectedQuote.currency}</span>
                      <span>Source: {selectedQuote.source}</span>
                    </div>
                  </div>

                  {/* Period filter buttons */}
                  <div className="flex gap-1">
                    {PERIODS.map((p) => (
                      <Button
                        key={p.value}
                        variant={selectedPeriod === p.value ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setSelectedPeriod(p.value)}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </div>

                  {/* Mini price chart */}
                  {historyLoading ? (
                    renderLoadingSpinner()
                  ) : priceHistory && priceHistory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={priceHistory}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(date: string) => {
                            const d = new Date(date)
                            if (selectedPeriod === "1d") {
                              return `${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`
                            }
                            return `${d.getMonth() + 1}/${d.getDate()}`
                          }}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis
                          domain={["auto", "auto"]}
                          tickFormatter={(value: number) => value.toFixed(2)}
                          tick={{ fontSize: 12 }}
                          width={70}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="rounded-lg border bg-background p-3 shadow-sm">
                                  <p className="text-sm font-medium">{formatDate(label)}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Close: {formatCurrency(payload[0].value as number, selectedQuote.currency)}
                                  </p>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="close"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        {/* Three data cards row */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Commodities */}
          <Card>
            <CardHeader>
              <CardTitle>Commodities</CardTitle>
            </CardHeader>
            <CardContent>
              {commoditiesLoading ? (
                renderLoadingSpinner()
              ) : commoditiesError ? (
                renderError("Failed to load commodities.")
              ) : !commodities || commodities.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No commodity data available.
                </p>
              ) : (
                <div className="space-y-3">
                  {commodities.map((commodity: MarketQuote) => (
                    <div
                      key={commodity.symbol}
                      className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{commodity.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {commodity.symbol}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium tabular-nums">
                          {formatCurrency(commodity.price, commodity.currency)}
                        </p>
                        <div className="flex items-center justify-end gap-1">
                          <span
                            className={cn(
                              "text-xs tabular-nums",
                              commodity.change > 0 && "text-emerald-600",
                              commodity.change < 0 && "text-red-600",
                              commodity.change === 0 && "text-muted-foreground"
                            )}
                          >
                            {commodity.change > 0 ? "+" : ""}
                            {commodity.change.toFixed(2)}
                          </span>
                          <span
                            className={cn(
                              "text-xs tabular-nums",
                              commodity.changePct > 0 && "text-emerald-600",
                              commodity.changePct < 0 && "text-red-600",
                              commodity.changePct === 0 && "text-muted-foreground"
                            )}
                          >
                            ({formatPercentage(commodity.changePct)})
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* FX Rates */}
          <Card>
            <CardHeader>
              <CardTitle>FX Rates</CardTitle>
            </CardHeader>
            <CardContent>
              {fxLoading ? (
                renderLoadingSpinner()
              ) : fxError ? (
                renderError("Failed to load FX rates.")
              ) : !fxRates || fxRates.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No FX rate data available.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pair</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fxRates.map((fx) => (
                      <TableRow key={fx.pair}>
                        <TableCell className="font-medium">{fx.pair}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {fx.rate.toFixed(4)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Bond Yields */}
          <Card>
            <CardHeader>
              <CardTitle>Bond Yields</CardTitle>
            </CardHeader>
            <CardContent>
              {bondsLoading ? (
                renderLoadingSpinner()
              ) : bondsError ? (
                renderError("Failed to load bond yields.")
              ) : !bonds || bonds.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No bond data available.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Yield %</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bonds.map((bond) => (
                      <TableRow key={bond.symbol}>
                        <TableCell className="font-medium">{bond.name}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {bond.yieldPct.toFixed(3)}%
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right tabular-nums",
                            bond.change > 0 && "text-emerald-600",
                            bond.change < 0 && "text-red-600"
                          )}
                        >
                          {bond.change > 0 ? "+" : ""}
                          {bond.change.toFixed(3)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
