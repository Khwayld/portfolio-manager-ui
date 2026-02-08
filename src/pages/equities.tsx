import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { PageHeader } from "@/components/common/page-header"
import { CurrencyDisplay } from "@/components/common/currency-display"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Trash2, Search, Loader2, TrendingUp } from "lucide-react"
import { portfoliosApi } from "@/api/portfolios.api"
import { holdingsApi } from "@/api/holdings.api"
import { marketDataApi } from "@/api/market-data.api"
import { CURRENCIES } from "@/lib/constants"
import { cn, formatCurrency } from "@/lib/utils"
import type { Holding } from "@/types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function detectMarketSource(symbol: string, exchange: string): string {
  if (symbol.endsWith(".KW")) return "boursa_kuwait"
  if (symbol.endsWith(".SR")) return "saudi"
  if (symbol.endsWith(".AE")) return "uae"
  if (symbol.endsWith(".BH")) return "bahrain"
  if (symbol.endsWith(".QA")) return "qatar"
  const usExchanges = ["NMS", "NYQ", "NGM", "PCX", "BTS", "NASDAQ", "NYSE"]
  if (usExchanges.some((e) => exchange?.toUpperCase().includes(e))) return "us"
  return "international"
}

function detectCurrency(symbol: string): string {
  if (symbol.endsWith(".KW")) return "KWD"
  if (symbol.endsWith(".SR")) return "SAR"
  if (symbol.endsWith(".AE")) return "AED"
  if (symbol.endsWith(".BH")) return "BHD"
  if (symbol.endsWith(".QA")) return "QAR"
  if (symbol.endsWith(".L")) return "GBP"
  return "USD"
}

interface SearchResult {
  symbol: string
  name: string
  exchange: string
  assetType: string
  source?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EquitiesPage() {
  const queryClient = useQueryClient()

  // Portfolio selector
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>("")

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)

  // Search autocomplete state
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Selected result from autocomplete
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)

  // Form fields (filled after selection)
  const [quantity, setQuantity] = useState("")
  const [avgCostPrice, setAvgCostPrice] = useState("")
  const [currency, setCurrency] = useState("KWD")
  const [formError, setFormError] = useState<string | null>(null)

  // Delete state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // ---- Portfolios --------------------------------------------------------
  const { data: portfolios, isLoading: portfoliosLoading } = useQuery({
    queryKey: ["portfolios"],
    queryFn: portfoliosApi.list,
  })

  // Default to first portfolio
  useEffect(() => {
    if (portfolios && portfolios.length > 0 && !selectedPortfolioId) {
      setSelectedPortfolioId(portfolios[0].id)
    }
  }, [portfolios, selectedPortfolioId])

  // ---- Holdings (equity only) --------------------------------------------
  const { data: holdings, isLoading: holdingsLoading } = useQuery({
    queryKey: ["holdings", selectedPortfolioId, { assetClass: "equity" }],
    queryFn: () => holdingsApi.list(selectedPortfolioId, { assetClass: "equity" }),
    enabled: !!selectedPortfolioId,
  })

  // ---- Search autocomplete -----------------------------------------------
  // Debounce the search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Open dropdown when query changes and has results
  useEffect(() => {
    if (debouncedQuery.length >= 1) {
      setDropdownOpen(true)
    } else {
      setDropdownOpen(false)
    }
  }, [debouncedQuery])

  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ["market-search-equities", debouncedQuery],
    queryFn: () => marketDataApi.search(debouncedQuery),
    enabled: !!debouncedQuery && debouncedQuery.length >= 1,
  })

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // ---- Price fetch for selected result -----------------------------------
  const { data: priceData, isLoading: priceLoading } = useQuery({
    queryKey: ["market-price", selectedResult?.symbol, selectedResult?.source],
    queryFn: () =>
      marketDataApi.getPrice(
        selectedResult!.symbol,
        selectedResult!.source === "boursa_kuwait" ? "boursa_kuwait" : undefined
      ),
    enabled: !!selectedResult,
  })

  // Auto-fill price when priceData arrives
  useEffect(() => {
    if (priceData && selectedResult) {
      setAvgCostPrice(String(priceData.price || ""))
      setCurrency(priceData.currency || detectCurrency(selectedResult.symbol))
    }
  }, [priceData, selectedResult])

  // ---- Create mutation ---------------------------------------------------
  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof holdingsApi.create>[1]) =>
      holdingsApi.create(selectedPortfolioId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holdings", selectedPortfolioId] })
      closeDialog()
    },
    onError: (err: Error) => {
      setFormError(err.message || "Failed to create equity holding")
    },
  })

  // ---- Handlers ----------------------------------------------------------

  function handleSelectResult(result: SearchResult) {
    setSelectedResult(result)
    setCurrency(detectCurrency(result.symbol))
    setSearchQuery("")
    setDebouncedQuery("")
    setDropdownOpen(false)
  }

  function resetForm() {
    setSearchQuery("")
    setDebouncedQuery("")
    setDropdownOpen(false)
    setSelectedResult(null)
    setQuantity("")
    setAvgCostPrice("")
    setCurrency("KWD")
    setFormError(null)
  }

  function closeDialog() {
    setDialogOpen(false)
    resetForm()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!selectedResult) {
      setFormError("Search and select an equity first")
      return
    }
    if (!quantity || Number(quantity) <= 0) {
      setFormError("Quantity must be greater than 0")
      return
    }
    if (!avgCostPrice || Number(avgCostPrice) < 0) {
      setFormError("Average cost price must be 0 or greater")
      return
    }

    createMutation.mutate({
      assetClass: "equity",
      marketSource: detectMarketSource(selectedResult.symbol, selectedResult.exchange),
      symbol: selectedResult.symbol,
      name: selectedResult.name,
      currency,
      quantity: Number(quantity),
      avgCostPrice: Number(avgCostPrice),
      currentPrice: priceData?.price ?? null,
    })
  }

  async function handleDelete(holdingId: string) {
    try {
      setDeleteLoading(true)
      await holdingsApi.delete(holdingId)
      queryClient.invalidateQueries({ queryKey: ["holdings", selectedPortfolioId] })
      setDeleteConfirmId(null)
    } catch (err) {
      console.error("Failed to delete holding:", err)
    } finally {
      setDeleteLoading(false)
    }
  }

  // ---- Computed values ---------------------------------------------------

  const equityHoldings = holdings ?? []

  const computeMarketValue = (h: Holding) => {
    const price = h.currentPrice ?? h.avgCostPrice
    return h.quantity * price
  }

  const computeGainLoss = (h: Holding) => {
    if (h.currentPrice == null) return 0
    return (h.currentPrice - h.avgCostPrice) * h.quantity
  }

  const computeGainLossPct = (h: Holding) => {
    if (h.currentPrice == null || h.avgCostPrice === 0) return 0
    return ((h.currentPrice - h.avgCostPrice) / h.avgCostPrice) * 100
  }

  const isLoading = portfoliosLoading || holdingsLoading

  // ---- Render ------------------------------------------------------------

  return (
    <div>
      <PageHeader
        title="Equities"
        description="View and manage your equity holdings across portfolios"
        actions={
          <Button
            onClick={() => {
              resetForm()
              setDialogOpen(true)
            }}
            disabled={!selectedPortfolioId}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Equity
          </Button>
        }
      />

      {/* Portfolio selector */}
      <div className="mb-6 max-w-xs">
        <Label className="mb-2 block">Portfolio</Label>
        <Select value={selectedPortfolioId} onValueChange={setSelectedPortfolioId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a portfolio" />
          </SelectTrigger>
          <SelectContent>
            {(portfolios ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Equity holdings table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Equity Holdings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading equities...</span>
            </div>
          ) : !selectedPortfolioId ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Select a portfolio to view equity holdings.
            </p>
          ) : equityHoldings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No equity holdings found. Click "Add Equity" to create one.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Avg Cost</TableHead>
                  <TableHead className="text-right">Current Price</TableHead>
                  <TableHead className="text-right">Market Value</TableHead>
                  <TableHead className="text-right">Gain/Loss</TableHead>
                  <TableHead className="text-right">Gain/Loss %</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {equityHoldings.map((holding) => {
                  const marketValue = computeMarketValue(holding)
                  const gainLoss = computeGainLoss(holding)
                  const gainLossPct = computeGainLossPct(holding)
                  const isPositive = gainLoss >= 0

                  return (
                    <TableRow key={holding.id}>
                      <TableCell className="font-medium">{holding.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {holding.symbol ?? "\u2014"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {holding.quantity?.toLocaleString() ?? 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <CurrencyDisplay amount={holding.avgCostPrice} currency={holding.currency} />
                      </TableCell>
                      <TableCell className="text-right">
                        {holding.currentPrice != null ? (
                          <CurrencyDisplay amount={holding.currentPrice} currency={holding.currency} />
                        ) : (
                          "\u2014"
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <CurrencyDisplay amount={marketValue} currency={holding.currency} />
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-medium",
                          gainLoss !== 0 && (isPositive ? "text-emerald-600" : "text-red-600")
                        )}
                      >
                        {gainLoss !== 0
                          ? (isPositive ? "+" : "") + formatCurrency(gainLoss, holding.currency)
                          : "\u2014"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          gainLossPct !== 0 && (gainLossPct >= 0 ? "text-emerald-600" : "text-red-600")
                        )}
                      >
                        {gainLossPct !== 0
                          ? `${gainLossPct >= 0 ? "+" : ""}${gainLossPct.toFixed(2)}%`
                          : "\u2014"}
                      </TableCell>
                      <TableCell>{holding.currency}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirmId(holding.id)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ---- Add Equity dialog ---- */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true) }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Equity</DialogTitle>
            <DialogDescription>
              Search for a stock or ETF to add to your portfolio.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Search autocomplete */}
            {!selectedResult ? (
              <div className="space-y-2">
                <Label>Search Equity</Label>
                <div className="relative" ref={dropdownRef}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by symbol or name (e.g. AAPL, NBK, KFH)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (debouncedQuery.length >= 1) setDropdownOpen(true)
                    }}
                    className="pl-9"
                    autoFocus
                  />

                  {/* Autocomplete dropdown */}
                  {dropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-80 overflow-auto">
                      {searching && (
                        <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Searching...
                        </div>
                      )}

                      {searchResults && searchResults.length > 0 &&
                        searchResults.map((r, i) => (
                          <div
                            key={`${r.symbol}-${i}`}
                            className="flex items-center justify-between px-3 py-2 hover:bg-accent cursor-pointer border-b last:border-b-0 text-sm"
                            onClick={() => handleSelectResult(r as SearchResult)}
                          >
                            <div className="flex-1 min-w-0">
                              <span className="font-medium">{r.symbol}</span>
                              <span className="ml-2 text-muted-foreground truncate">{r.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 ml-2 shrink-0">
                              <Badge variant="outline" className="text-xs">
                                {r.exchange || r.assetType}
                              </Badge>
                              {(r as SearchResult).source && (
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "text-xs",
                                    (r as SearchResult).source === "boursa_kuwait"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-blue-100 text-blue-800"
                                  )}
                                >
                                  {(r as SearchResult).source === "boursa_kuwait" ? "Boursa" : "Yahoo"}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}

                      {searchResults && searchResults.length === 0 && debouncedQuery && !searching && (
                        <p className="px-3 py-3 text-sm text-muted-foreground">
                          No results found for "{debouncedQuery}"
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Selected equity info */}
                <div className="rounded-md border p-3 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedResult.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedResult.symbol} \u2014 {selectedResult.exchange}
                        {selectedResult.source && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              "ml-2 text-xs",
                              selectedResult.source === "boursa_kuwait"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            )}
                          >
                            {selectedResult.source === "boursa_kuwait" ? "Boursa" : "Yahoo"}
                          </Badge>
                        )}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedResult(null)
                        setAvgCostPrice("")
                      }}
                    >
                      Change
                    </Button>
                  </div>
                  {priceLoading && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Fetching current price...
                    </div>
                  )}
                  {priceData && (
                    <p className="mt-2 text-sm">
                      Current price:{" "}
                      <span className="font-medium">
                        {formatCurrency(priceData.price, priceData.currency)}
                      </span>
                    </p>
                  )}
                </div>

                {/* Quantity + Avg Cost Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="eq-quantity">Quantity *</Label>
                    <Input
                      id="eq-quantity"
                      type="number"
                      placeholder="0"
                      min="0"
                      step="any"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eq-cost">Avg Cost Price *</Label>
                    <Input
                      id="eq-cost"
                      type="number"
                      placeholder="0.000"
                      min="0"
                      step="any"
                      value={avgCostPrice}
                      onChange={(e) => setAvgCostPrice(e.target.value)}
                    />
                  </div>
                </div>

                {/* Currency */}
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || !selectedResult}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Equity"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---- Delete confirmation dialog ---- */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Equity</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this equity holding? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
