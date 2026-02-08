import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { PageHeader } from "@/components/common/page-header"
import { CurrencyDisplay } from "@/components/common/currency-display"
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
import { Plus, Trash2, Pencil, Loader2, Landmark, Calendar, Percent } from "lucide-react"
import { portfoliosApi } from "@/api/portfolios.api"
import { depositsApi } from "@/api/deposits.api"
import { CURRENCIES } from "@/lib/constants"
import { formatDate, formatPercentage } from "@/lib/utils"
import type { Deposit, DepositType, Compounding } from "@/types"

const DEPOSIT_TYPES: { value: DepositType; label: string }[] = [
  { value: "savings", label: "Savings" },
  { value: "term", label: "Term Deposit" },
  { value: "call", label: "Call Deposit" },
]

const COMPOUNDING_OPTIONS: { value: Compounding; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
]

const DEPOSIT_TYPE_COLORS: Record<DepositType, string> = {
  savings: "bg-emerald-100 text-emerald-800",
  term: "bg-blue-100 text-blue-800",
  call: "bg-amber-100 text-amber-800",
}

const DEPOSIT_TYPE_LABELS: Record<DepositType, string> = {
  savings: "Savings",
  term: "Term",
  call: "Call",
}

const COMPOUNDING_LABELS: Record<Compounding, string> = {
  daily: "Daily",
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
}

const TENOR_OPTIONS = [
  { value: "none", label: "None (Ongoing)" },
  { value: "1m", label: "1 Month" },
  { value: "3m", label: "3 Months" },
  { value: "6m", label: "6 Months" },
  { value: "1y", label: "1 Year" },
  { value: "2y", label: "2 Years" },
  { value: "3y", label: "3 Years" },
  { value: "5y", label: "5 Years" },
]

function calcMaturityDate(startDate: string, tenor: string): string {
  if (!startDate || !tenor) return ""
  const d = new Date(startDate)
  const num = parseInt(tenor)
  if (tenor.endsWith("m")) {
    d.setMonth(d.getMonth() + num)
  } else if (tenor.endsWith("y")) {
    d.setFullYear(d.getFullYear() + num)
  }
  return d.toISOString().slice(0, 10)
}

function getInitialForm() {
  return {
    bankName: "",
    accountNumber: "",
    depositType: "savings" as DepositType,
    principal: "",
    annualYieldPct: "",
    compounding: "monthly" as Compounding,
    startDate: new Date().toISOString().slice(0, 10),
    tenor: "none",
    currency: "KWD",
    isIslamic: false,
    notes: "",
  }
}

export default function DepositsPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>("")
  const [form, setForm] = useState(getInitialForm)
  const [error, setError] = useState<string | null>(null)
  const [editDeposit, setEditDeposit] = useState<Deposit | null>(null)

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

  // Fetch deposits for selected portfolio
  const {
    data: deposits,
    isLoading: depositsLoading,
  } = useQuery({
    queryKey: ["deposits", selectedPortfolioId],
    queryFn: () => depositsApi.list(selectedPortfolioId),
    enabled: !!selectedPortfolioId,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof depositsApi.create>[1]) =>
      depositsApi.create(selectedPortfolioId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deposits", selectedPortfolioId] })
      setDialogOpen(false)
      setForm(getInitialForm())
      setError(null)
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to create deposit")
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: depositsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deposits", selectedPortfolioId] })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Deposit> }) =>
      depositsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deposits", selectedPortfolioId] })
      setDialogOpen(false)
      setEditDeposit(null)
      setForm(getInitialForm())
      setError(null)
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to update deposit")
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.bankName.trim()) {
      setError("Bank name is required")
      return
    }

    const principal = parseFloat(form.principal)
    if (!principal || principal <= 0) {
      setError("Principal must be greater than 0")
      return
    }

    const maturityDate =
      form.tenor === "none" ? null : calcMaturityDate(form.startDate, form.tenor) || null

    const payload = {
      name: form.bankName.trim(),
      bankName: form.bankName.trim(),
      accountNumber: form.accountNumber || null,
      depositType: form.depositType,
      principal,
      annualYieldPct: parseFloat(form.annualYieldPct) || 0,
      compounding: form.compounding,
      startDate: form.startDate,
      maturityDate,
      currency: form.currency,
      isIslamic: form.isIslamic,
      notes: form.notes || null,
    }

    if (editDeposit) {
      updateMutation.mutate({ id: editDeposit.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isLoading = portfoliosLoading || depositsLoading

  return (
    <div>
      <PageHeader
        title="Deposits"
        description="Manage savings accounts and term deposits"
        actions={
          <Button onClick={() => { setEditDeposit(null); setForm(getInitialForm()); setError(null); setDialogOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Deposit
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

      {/* Deposits grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading deposits...</span>
        </div>
      ) : !selectedPortfolioId ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          Select a portfolio to view deposits.
        </p>
      ) : !deposits || deposits.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-muted-foreground">No deposits yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add your first deposit to track savings and yields
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {deposits.map((deposit) => (
            <Card key={deposit.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-muted-foreground" />
                      {deposit.bankName}
                    </CardTitle>
                    {deposit.accountNumber && (
                      <CardDescription>{deposit.accountNumber}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={DEPOSIT_TYPE_COLORS[deposit.depositType]}
                      variant="outline"
                    >
                      {DEPOSIT_TYPE_LABELS[deposit.depositType]}
                    </Badge>
                    {deposit.isIslamic && (
                      <Badge variant="secondary">Islamic</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Principal */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Principal</span>
                  <CurrencyDisplay
                    amount={deposit.principal}
                    currency={deposit.currency}
                    className="text-lg font-semibold"
                  />
                </div>

                {/* Annual Yield */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Percent className="h-3 w-3" />
                    Annual Yield
                  </span>
                  <span className="font-medium text-emerald-600">
                    {formatPercentage(deposit.annualYieldPct)}
                  </span>
                </div>

                {/* Compounding */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Compounding</span>
                  <span className="text-sm font-medium">
                    {COMPOUNDING_LABELS[deposit.compounding]}
                  </span>
                </div>

                {/* Start Date */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Start Date
                  </span>
                  <span className="text-sm">{formatDate(deposit.startDate)}</span>
                </div>

                {/* Maturity Date (for term deposits) */}
                {deposit.maturityDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Maturity</span>
                    <span className="text-sm">{formatDate(deposit.maturityDate)}</span>
                  </div>
                )}

                {/* Projected Yield */}
                {deposit.projectedYield !== undefined && deposit.projectedYield !== null && (
                  <div className="flex items-center justify-between border-t pt-3">
                    <span className="text-sm text-muted-foreground">Projected Yield</span>
                    <CurrencyDisplay
                      amount={deposit.projectedYield}
                      currency={deposit.currency}
                      colored
                      className="font-semibold"
                    />
                  </div>
                )}

                {/* Notes */}
                {deposit.notes && (
                  <p className="text-xs text-muted-foreground border-t pt-3 truncate">
                    {deposit.notes}
                  </p>
                )}

                {/* Edit and Delete buttons */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditDeposit(deposit)
                      setForm({
                        bankName: deposit.bankName,
                        accountNumber: deposit.accountNumber || "",
                        depositType: deposit.depositType,
                        principal: String(deposit.principal),
                        annualYieldPct: String(deposit.annualYieldPct),
                        compounding: deposit.compounding,
                        startDate: deposit.startDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
                        tenor: "none",
                        currency: deposit.currency,
                        isIslamic: deposit.isIslamic,
                        notes: deposit.notes || "",
                      })
                      setError(null)
                      setDialogOpen(true)
                    }}
                  >
                    <Pencil className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(deposit.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Deposit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditDeposit(null) }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editDeposit ? "Edit Deposit" : "Add Deposit"}</DialogTitle>
            <DialogDescription>
              {editDeposit
                ? "Update the deposit details below."
                : "Create a new deposit or savings account entry."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Bank Name */}
            <div className="space-y-2">
              <Label htmlFor="dep-bank">Bank Name *</Label>
              <Input
                id="dep-bank"
                placeholder="e.g. National Bank of Kuwait"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                required
              />
            </div>

            {/* Account Number */}
            <div className="space-y-2">
              <Label htmlFor="dep-account">Account Number</Label>
              <Input
                id="dep-account"
                placeholder="Optional"
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
              />
            </div>

            {/* Deposit Type */}
            <div className="space-y-2">
              <Label>Deposit Type</Label>
              <Select value={form.depositType} onValueChange={(v) => setForm({ ...form, depositType: v as DepositType })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {DEPOSIT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Principal + Annual Yield row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dep-principal">Principal *</Label>
                <Input
                  id="dep-principal"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={form.principal}
                  onChange={(e) => setForm({ ...form, principal: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dep-yield">Annual Yield %</Label>
                <Input
                  id="dep-yield"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={form.annualYieldPct}
                  onChange={(e) => setForm({ ...form, annualYieldPct: e.target.value })}
                />
              </div>
            </div>

            {/* Compounding */}
            <div className="space-y-2">
              <Label>Compounding Frequency</Label>
              <Select value={form.compounding} onValueChange={(v) => setForm({ ...form, compounding: v as Compounding })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {COMPOUNDING_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date + Tenor row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dep-start">Start Date</Label>
                <Input
                  id="dep-start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tenor</Label>
                <Select value={form.tenor} onValueChange={(v) => setForm({ ...form, tenor: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenor" />
                  </SelectTrigger>
                  <SelectContent>
                    {TENOR_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.startDate && form.tenor && form.tenor !== "none" && (
                  <p className="text-xs text-muted-foreground">
                    Matures: {formatDate(calcMaturityDate(form.startDate, form.tenor))}
                  </p>
                )}
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

            {/* Is Islamic checkbox */}
            <div className="flex items-center gap-2">
              <input
                id="dep-islamic"
                type="checkbox"
                checked={form.isIslamic}
                onChange={(e) => setForm({ ...form, isIslamic: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="dep-islamic" className="cursor-pointer">Islamic (Sharia compliant)</Label>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="dep-notes">Notes</Label>
              <Input
                id="dep-notes"
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
              <Button
                type="submit"
                disabled={editDeposit ? updateMutation.isPending : createMutation.isPending}
              >
                {(editDeposit ? updateMutation.isPending : createMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editDeposit ? "Update" : "Add Deposit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
