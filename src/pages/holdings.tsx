import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { usePortfolio } from "@/hooks/use-portfolios"
import { useHoldings, useCreateHolding } from "@/hooks/use-holdings"
import { holdingsApi } from "@/api/holdings.api"
import { marketDataApi } from "@/api/market-data.api"
import { ASSET_CLASS_LABELS, ASSET_CLASS_COLORS, CURRENCIES } from "@/lib/constants"
import { cn, formatCurrency } from "@/lib/utils"
import type { AssetClass, Holding } from "@/types"
import { Plus, Trash2, ArrowLeft, Search, Loader2 } from "lucide-react"

const ALL_ASSET_CLASSES: AssetClass[] = [
  "equity",
  "fixed_income",
  "commodity",
  "deposit",
  "real_estate",
  "cash",
]

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

function detectAssetClass(symbol: string, assetType: string): AssetClass {
  if (symbol.includes("=F")) return "commodity"
  if (symbol.includes("=X")) return "cash"
  if (symbol.startsWith("^") && (symbol.includes("TNX") || symbol.includes("TYX") || symbol.includes("FVX")))
    return "fixed_income"
  if (assetType === "MUTUALFUND" || assetType === "ETF") return "equity"
  return "equity"
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

export default function HoldingsPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio(id!)
  const { data: holdings, isLoading: holdingsLoading } = useHoldings(id!)
  const createHolding = useCreateHolding(id!)

  const [activeTab, setActiveTab] = useState("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [selectedResult, setSelectedResult] = useState<{
    symbol: string
    name: string
    exchange: string
    assetType: string
  } | null>(null)

  // Form state (only quantity and price needed after search selection)
  const [quantity, setQuantity] = useState("")
  const [avgCostPrice, setAvgCostPrice] = useState("")
  const [currency, setCurrency] = useState("KWD")
  const [assetClass, setAssetClass] = useState<AssetClass>("equity")
  const [acquisitionDate, setAcquisitionDate] = useState("")
  const [createError, setCreateError] = useState<string | null>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Search API
  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ["market-search-holdings", debouncedQuery],
    queryFn: () => marketDataApi.search(debouncedQuery),
    enabled: !!debouncedQuery && debouncedQuery.length >= 1,
  })

  // When a search result is selected, auto-fill the price
  const { data: priceData, isLoading: priceLoading } = useQuery({
    queryKey: ["market-price", selectedResult?.symbol],
    queryFn: () => marketDataApi.getPrice(selectedResult!.symbol),
    enabled: !!selectedResult,
  })

  useEffect(() => {
    if (priceData && selectedResult) {
      setAvgCostPrice(String(priceData.price || ""))
      setCurrency(priceData.currency || detectCurrency(selectedResult.symbol))
    }
  }, [priceData, selectedResult])

  const handleSelectResult = (result: { symbol: string; name: string; exchange: string; assetType: string }) => {
    setSelectedResult(result)
    setAssetClass(detectAssetClass(result.symbol, result.assetType))
    setCurrency(detectCurrency(result.symbol))
    setSearchQuery("")
    setDebouncedQuery("")
  }

  const resetForm = () => {
    setSearchQuery("")
    setDebouncedQuery("")
    setSelectedResult(null)
    setQuantity("")
    setAvgCostPrice("")
    setCurrency("KWD")
    setAssetClass("equity")
    setAcquisitionDate("")
    setCreateError(null)
  }

  const handleCreate = async () => {
    if (!selectedResult) {
      setCreateError("Search and select an asset first")
      return
    }
    if (!quantity || Number(quantity) <= 0) {
      setCreateError("Quantity must be greater than 0")
      return
    }
    if (!avgCostPrice || Number(avgCostPrice) < 0) {
      setCreateError("Average cost price must be 0 or greater")
      return
    }

    try {
      setCreateError(null)
      await createHolding.mutateAsync({
        assetClass,
        marketSource: detectMarketSource(selectedResult.symbol, selectedResult.exchange),
        symbol: selectedResult.symbol,
        name: selectedResult.name,
        currency,
        quantity: Number(quantity),
        avgCostPrice: Number(avgCostPrice),
        currentPrice: priceData?.price ?? null,
        acquisitionDate: acquisitionDate || null,
      })
      setCreateOpen(false)
      resetForm()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create holding")
    }
  }

  const handleDelete = async (holdingId: string) => {
    try {
      setDeleteLoading(true)
      await holdingsApi.delete(holdingId)
      queryClient.invalidateQueries({ queryKey: ["holdings", id] })
      setDeleteConfirmId(null)
    } catch (err) {
      console.error("Failed to delete holding:", err)
    } finally {
      setDeleteLoading(false)
    }
  }

  const isLoading = portfolioLoading || holdingsLoading

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Holdings" description="Loading..." />
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  const holdingsList = holdings ?? []
  const filteredHoldings =
    activeTab === "all"
      ? holdingsList
      : holdingsList.filter((h) => h.assetClass === activeTab)

  const computeMarketValue = (h: Holding) => {
    const price = h.currentPrice ?? h.avgCostPrice
    return h.quantity * price
  }

  const computeGainLoss = (h: Holding) => {
    if (h.currentPrice == null) return 0
    return (h.currentPrice - h.avgCostPrice) * h.quantity
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/portfolios"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Portfolios
        </Link>
      </div>

      <PageHeader
        title={portfolio?.name ?? "Holdings"}
        description={
          portfolio
            ? `${portfolio.description ? portfolio.description + " — " : ""}Base currency: ${portfolio.baseCurrency}`
            : "Portfolio holdings"
        }
        actions={
          <Button onClick={() => { resetForm(); setCreateOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Holding
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          {ALL_ASSET_CLASSES.map((ac) => (
            <TabsTrigger key={ac} value={ac}>
              {ASSET_CLASS_LABELS[ac]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab}>
          {filteredHoldings.length === 0 ? (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-muted-foreground">No holdings found</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {activeTab === "all"
                    ? "Add your first holding to start tracking your investments."
                    : `No ${ASSET_CLASS_LABELS[activeTab as AssetClass] ?? activeTab} holdings in this portfolio.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Asset Class</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Avg Cost</TableHead>
                    <TableHead className="text-right">Current Price</TableHead>
                    <TableHead className="text-right">Market Value</TableHead>
                    <TableHead className="text-right">Gain/Loss</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHoldings.map((holding) => {
                    const marketValue = computeMarketValue(holding)
                    const gainLoss = computeGainLoss(holding)
                    const isPositive = gainLoss >= 0

                    return (
                      <TableRow key={holding.id}>
                        <TableCell className="font-medium">{holding.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {holding.symbol ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: ASSET_CLASS_COLORS[holding.assetClass],
                              color: ASSET_CLASS_COLORS[holding.assetClass],
                            }}
                          >
                            {ASSET_CLASS_LABELS[holding.assetClass]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {holding.quantity?.toLocaleString() ?? 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(holding.avgCostPrice, holding.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          {holding.currentPrice != null
                            ? formatCurrency(holding.currentPrice, holding.currency)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(marketValue, holding.currency)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-medium",
                            gainLoss !== 0 && (isPositive ? "text-green-600" : "text-red-600")
                          )}
                        >
                          {gainLoss !== 0 ? (isPositive ? "+" : "") + formatCurrency(gainLoss, holding.currency) : "—"}
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
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Holding Dialog — Search-based */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Holding</DialogTitle>
            <DialogDescription>
              Search for a stock, ETF, commodity, or currency to add to your portfolio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search input */}
            {!selectedResult ? (
              <div className="space-y-2">
                <Label>Search Asset</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by symbol or name (e.g. AAPL, NBK.KW, GC=F)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>

                {/* Search results */}
                {searching && (
                  <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching...
                  </div>
                )}
                {searchResults && searchResults.length > 0 && (
                  <div className="max-h-64 overflow-auto border rounded-md">
                    {searchResults.map((r: any, i: number) => (
                      <div
                        key={`${r.symbol}-${i}`}
                        className="flex items-center justify-between px-3 py-2 hover:bg-accent cursor-pointer border-b last:border-b-0 text-sm"
                        onClick={() => handleSelectResult(r)}
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{r.symbol}</span>
                          <span className="ml-2 text-muted-foreground truncate">{r.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 ml-2 shrink-0">
                          <Badge variant="outline" className="text-xs">{r.exchange || r.assetType}</Badge>
                          {r.source && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-xs",
                                r.source === "boursa_kuwait"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                              )}
                            >
                              {r.source === "boursa_kuwait" ? "Boursa" : "Yahoo"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults && searchResults.length === 0 && debouncedQuery && (
                  <p className="text-sm text-muted-foreground py-2">No results found for "{debouncedQuery}"</p>
                )}
              </div>
            ) : (
              <>
                {/* Selected asset info */}
                <div className="rounded-md border p-3 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedResult.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedResult.symbol} — {selectedResult.exchange}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedResult(null); setAvgCostPrice("") }}>
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
                      Current price: <span className="font-medium">{formatCurrency(priceData.price, priceData.currency)}</span>
                    </p>
                  )}
                </div>

                {/* Asset class (auto-detected, editable) */}
                <div className="space-y-2">
                  <Label>Asset Class</Label>
                  <Select value={assetClass} onValueChange={(v) => setAssetClass(v as AssetClass)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_ASSET_CLASSES.map((ac) => (
                        <SelectItem key={ac} value={ac}>
                          {ASSET_CLASS_LABELS[ac]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity + Cost Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input
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
                    <Label>Avg Cost Price *</Label>
                    <Input
                      type="number"
                      placeholder="0.000"
                      min="0"
                      step="any"
                      value={avgCostPrice}
                      onChange={(e) => setAvgCostPrice(e.target.value)}
                    />
                  </div>
                </div>

                {/* Currency + Acquisition Date */}
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label>Acquisition Date</Label>
                    <Input
                      type="date"
                      value={acquisitionDate}
                      onChange={(e) => setAcquisitionDate(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm() }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createHolding.isPending || !selectedResult}>
              {createHolding.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</>
              ) : (
                "Add Holding"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => { if (!open) setDeleteConfirmId(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Holding</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this holding? This action cannot be undone.
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
