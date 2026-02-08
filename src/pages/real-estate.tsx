import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { PageHeader } from "@/components/common/page-header"
import { CurrencyDisplay } from "@/components/common/currency-display"
import { PercentageBadge } from "@/components/common/percentage-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Plus, Trash2, Loader2, MapPin, Home, Users } from "lucide-react"
import { portfoliosApi } from "@/api/portfolios.api"
import { realEstateApi } from "@/api/real-estate.api"
import { CURRENCIES } from "@/lib/constants"
import { formatDate } from "@/lib/utils"
import type { PropertyType, OccupancyStatus } from "@/types"

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "commercial", label: "Commercial" },
  { value: "land", label: "Land" },
]

const OCCUPANCY_STATUSES: { value: OccupancyStatus; label: string }[] = [
  { value: "occupied", label: "Occupied" },
  { value: "vacant", label: "Vacant" },
  { value: "partial", label: "Partial" },
]

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: "Apartment",
  villa: "Villa",
  commercial: "Commercial",
  land: "Land",
}

const PROPERTY_TYPE_COLORS: Record<PropertyType, string> = {
  apartment: "bg-blue-100 text-blue-800",
  villa: "bg-purple-100 text-purple-800",
  commercial: "bg-amber-100 text-amber-800",
  land: "bg-emerald-100 text-emerald-800",
}

const OCCUPANCY_COLORS: Record<OccupancyStatus, string> = {
  occupied: "bg-emerald-100 text-emerald-800",
  vacant: "bg-red-100 text-red-800",
  partial: "bg-yellow-100 text-yellow-800",
}

const OCCUPANCY_LABELS: Record<OccupancyStatus, string> = {
  occupied: "Occupied",
  vacant: "Vacant",
  partial: "Partial",
}

function getInitialForm() {
  return {
    address: "",
    propertyType: "apartment" as PropertyType,
    purchasePrice: "",
    currentValue: "",
    areaSqm: "",
    monthlyRent: "",
    occupancyStatus: "vacant" as OccupancyStatus,
    tenantName: "",
    leaseStart: "",
    leaseEnd: "",
    currency: "KWD",
    notes: "",
  }
}

export default function RealEstatePage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>("")
  const [form, setForm] = useState(getInitialForm)
  const [error, setError] = useState<string | null>(null)

  // Fetch portfolios
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

  // Fetch properties for selected portfolio
  const {
    data: properties,
    isLoading: propertiesLoading,
  } = useQuery({
    queryKey: ["properties", selectedPortfolioId],
    queryFn: () => realEstateApi.listProperties(selectedPortfolioId),
    enabled: !!selectedPortfolioId,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof realEstateApi.createProperty>[1]) =>
      realEstateApi.createProperty(selectedPortfolioId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties", selectedPortfolioId] })
      setDialogOpen(false)
      setForm(getInitialForm())
      setError(null)
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to create property")
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: realEstateApi.deleteProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties", selectedPortfolioId] })
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.address.trim()) {
      setError("Address is required")
      return
    }

    const purchasePrice = parseFloat(form.purchasePrice)
    if (!purchasePrice || purchasePrice <= 0) {
      setError("Purchase price must be greater than 0")
      return
    }

    const currentValue = parseFloat(form.currentValue)
    if (!currentValue || currentValue <= 0) {
      setError("Current value must be greater than 0")
      return
    }

    createMutation.mutate({
      name: form.address.trim(),
      address: form.address.trim(),
      propertyType: form.propertyType,
      purchasePrice,
      currentValue,
      areaSqm: form.areaSqm ? parseFloat(form.areaSqm) : null,
      monthlyRent: form.monthlyRent ? parseFloat(form.monthlyRent) : null,
      occupancyStatus: form.occupancyStatus,
      tenantName: form.tenantName || null,
      leaseStart: form.leaseStart || null,
      leaseEnd: form.leaseEnd || null,
      currency: form.currency,
      notes: form.notes || null,
    })
  }

  const isLoading = portfoliosLoading || propertiesLoading

  return (
    <div>
      <PageHeader
        title="Real Estate"
        description="Manage properties and rental income"
        actions={
          <Button onClick={() => { setForm(getInitialForm()); setError(null); setDialogOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
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

      {/* Properties grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading properties...</span>
        </div>
      ) : !selectedPortfolioId ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          Select a portfolio to view properties.
        </p>
      ) : !properties || properties.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-muted-foreground">No properties yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add your first property to track real estate investments
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => {
            const gainLoss = property.currentValue - property.purchasePrice
            const gainLossPct = property.purchasePrice > 0
              ? ((property.currentValue - property.purchasePrice) / property.purchasePrice) * 100
              : 0

            return (
              <Card key={property.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 min-w-0 flex-1 mr-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{property.address}</span>
                      </CardTitle>
                      {property.areaSqm && (
                        <CardDescription>{property.areaSqm} sqm</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        className={PROPERTY_TYPE_COLORS[property.propertyType]}
                        variant="outline"
                      >
                        {PROPERTY_TYPE_LABELS[property.propertyType]}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Purchase Price */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Purchase Price</span>
                    <CurrencyDisplay
                      amount={property.purchasePrice}
                      currency={property.currency}
                    />
                  </div>

                  {/* Current Value */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current Value</span>
                    <CurrencyDisplay
                      amount={property.currentValue}
                      currency={property.currency}
                      className="text-lg font-semibold"
                    />
                  </div>

                  {/* Gain/Loss */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Gain/Loss</span>
                    <div className="flex items-center gap-2">
                      <CurrencyDisplay
                        amount={gainLoss}
                        currency={property.currency}
                        colored
                      />
                      <PercentageBadge value={gainLossPct} />
                    </div>
                  </div>

                  {/* Monthly Rent */}
                  {property.monthlyRent !== null && property.monthlyRent !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Home className="h-3 w-3" />
                        Monthly Rent
                      </span>
                      <CurrencyDisplay
                        amount={property.monthlyRent}
                        currency={property.currency}
                      />
                    </div>
                  )}

                  {/* Occupancy Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Occupancy
                    </span>
                    <Badge
                      className={OCCUPANCY_COLORS[property.occupancyStatus]}
                      variant="outline"
                    >
                      {OCCUPANCY_LABELS[property.occupancyStatus]}
                    </Badge>
                  </div>

                  {/* Tenant */}
                  {property.tenantName && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tenant</span>
                      <span className="text-sm font-medium">{property.tenantName}</span>
                    </div>
                  )}

                  {/* Lease Period */}
                  {property.leaseStart && property.leaseEnd && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Lease</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(property.leaseStart)} - {formatDate(property.leaseEnd)}
                      </span>
                    </div>
                  )}

                  {/* Notes */}
                  {property.notes && (
                    <p className="text-xs text-muted-foreground border-t pt-3 truncate">
                      {property.notes}
                    </p>
                  )}

                  {/* Delete button */}
                  <div className="flex justify-end pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(property.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Property dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Property</DialogTitle>
            <DialogDescription>Add a new property to your portfolio.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="prop-address">Address *</Label>
              <Input
                id="prop-address"
                placeholder="e.g. 123 Main St, Kuwait City"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
              />
            </div>

            {/* Property Type */}
            <div className="space-y-2">
              <Label>Property Type</Label>
              <Select value={form.propertyType} onValueChange={(v) => setForm({ ...form, propertyType: v as PropertyType })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Purchase Price + Current Value row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prop-purchase">Purchase Price *</Label>
                <Input
                  id="prop-purchase"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={form.purchasePrice}
                  onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-current">Current Value *</Label>
                <Input
                  id="prop-current"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={form.currentValue}
                  onChange={(e) => setForm({ ...form, currentValue: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Area + Monthly Rent row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prop-area">Area (sqm)</Label>
                <Input
                  id="prop-area"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0"
                  value={form.areaSqm}
                  onChange={(e) => setForm({ ...form, areaSqm: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-rent">Monthly Rent</Label>
                <Input
                  id="prop-rent"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={form.monthlyRent}
                  onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })}
                />
              </div>
            </div>

            {/* Occupancy Status */}
            <div className="space-y-2">
              <Label>Occupancy Status</Label>
              <Select value={form.occupancyStatus} onValueChange={(v) => setForm({ ...form, occupancyStatus: v as OccupancyStatus })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {OCCUPANCY_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tenant Name */}
            <div className="space-y-2">
              <Label htmlFor="prop-tenant">Tenant Name</Label>
              <Input
                id="prop-tenant"
                placeholder="Optional"
                value={form.tenantName}
                onChange={(e) => setForm({ ...form, tenantName: e.target.value })}
              />
            </div>

            {/* Lease Start + End row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prop-lease-start">Lease Start</Label>
                <Input
                  id="prop-lease-start"
                  type="date"
                  value={form.leaseStart}
                  onChange={(e) => setForm({ ...form, leaseStart: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-lease-end">Lease End</Label>
                <Input
                  id="prop-lease-end"
                  type="date"
                  value={form.leaseEnd}
                  onChange={(e) => setForm({ ...form, leaseEnd: e.target.value })}
                />
              </div>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
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

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="prop-notes">Notes</Label>
              <Input
                id="prop-notes"
                placeholder="Optional notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Property
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
