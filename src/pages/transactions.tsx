import { useState, useEffect } from "react"
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
import { Plus, Trash2, Loader2 } from "lucide-react"
import { portfoliosApi } from "@/api/portfolios.api"
import { holdingsApi } from "@/api/holdings.api"
import { transactionsApi } from "@/api/transactions.api"
import { TRANSACTION_TYPE_LABELS, CURRENCIES } from "@/lib/constants"
import { formatDate, formatCurrency } from "@/lib/utils"
import type { TransactionType } from "@/types"

const TRANSACTION_TYPES: TransactionType[] = [
  "buy",
  "sell",
  "dividend",
  "interest",
  "coupon",
  "rental_income",
  "deposit_yield",
  "fee",
  "transfer",
]

const TYPE_BADGE_COLORS: Record<TransactionType, string> = {
  buy: "bg-emerald-100 text-emerald-800",
  sell: "bg-red-100 text-red-800",
  dividend: "bg-blue-100 text-blue-800",
  interest: "bg-violet-100 text-violet-800",
  coupon: "bg-purple-100 text-purple-800",
  rental_income: "bg-pink-100 text-pink-800",
  deposit_yield: "bg-teal-100 text-teal-800",
  fee: "bg-orange-100 text-orange-800",
  transfer: "bg-gray-100 text-gray-800",
}

function getInitialForm() {
  return {
    holdingId: "",
    type: "buy" as TransactionType,
    date: new Date().toISOString().slice(0, 10),
    quantity: "",
    price: "",
    fee: "",
    currency: "KWD",
    notes: "",
  }
}

export default function TransactionsPage() {
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

  // Fetch holdings for selected portfolio
  const { data: holdings } = useQuery({
    queryKey: ["holdings", selectedPortfolioId],
    queryFn: () => holdingsApi.list(selectedPortfolioId),
    enabled: !!selectedPortfolioId,
  })

  // Fetch transactions for selected portfolio
  const {
    data: transactions,
    isLoading: transactionsLoading,
  } = useQuery({
    queryKey: ["transactions", selectedPortfolioId],
    queryFn: () => transactionsApi.list(selectedPortfolioId),
    enabled: !!selectedPortfolioId,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof transactionsApi.create>[1]) =>
      transactionsApi.create(selectedPortfolioId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", selectedPortfolioId] })
      setDialogOpen(false)
      setForm(getInitialForm())
      setError(null)
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to create transaction")
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: transactionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", selectedPortfolioId] })
    },
  })

  const quantity = parseFloat(form.quantity) || 0
  const price = parseFloat(form.price) || 0
  const computedAmount = quantity * price

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.holdingId) {
      setError("Please select a holding")
      return
    }

    createMutation.mutate({
      holdingId: form.holdingId,
      type: form.type,
      date: form.date,
      quantity,
      price,
      amount: computedAmount,
      fee: parseFloat(form.fee) || 0,
      currency: form.currency,
      notes: form.notes || null,
    })
  }

  // Build a lookup map for holding names
  const holdingMap = new Map(
    (holdings ?? []).map((h) => [h.id, h.name])
  )

  const isLoading = portfoliosLoading || transactionsLoading

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="View and manage your transaction history"
        actions={
          <Button onClick={() => { setForm(getInitialForm()); setError(null); setDialogOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
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

      {/* Transaction table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading transactions...</span>
            </div>
          ) : !selectedPortfolioId ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Select a portfolio to view transactions.
            </p>
          ) : !transactions || transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No transactions found. Click "Add Transaction" to create one.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Holding</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Fee</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(tx.date)}</TableCell>
                    <TableCell>{holdingMap.get(tx.holdingId) ?? tx.holdingId}</TableCell>
                    <TableCell>
                      <Badge
                        className={TYPE_BADGE_COLORS[tx.type] ?? "bg-gray-100 text-gray-800"}
                        variant="outline"
                      >
                        {TRANSACTION_TYPE_LABELS[tx.type] ?? tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{tx.quantity}</TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={tx.price} currency={tx.currency} />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={tx.amount} currency={tx.currency} />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={tx.fee} currency={tx.currency} />
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-muted-foreground text-xs">
                      {tx.notes ?? ""}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(tx.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Transaction dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>Record a new transaction for this portfolio.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Holding */}
            <div className="space-y-2">
              <Label>Holding</Label>
              <Select value={form.holdingId} onValueChange={(v) => setForm({ ...form, holdingId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select holding" />
                </SelectTrigger>
                <SelectContent>
                  {(holdings ?? []).map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}{h.symbol ? ` (${h.symbol})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Transaction Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as TransactionType })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TRANSACTION_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="tx-date">Date</Label>
              <Input
                id="tx-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>

            {/* Quantity + Price row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tx-quantity">Quantity</Label>
                <Input
                  id="tx-quantity"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tx-price">Price</Label>
                <Input
                  id="tx-price"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Computed amount */}
            <div className="space-y-2">
              <Label>Amount (auto-calculated)</Label>
              <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted/50 px-3 text-sm tabular-nums">
                {formatCurrency(computedAmount, form.currency)}
              </div>
            </div>

            {/* Fee */}
            <div className="space-y-2">
              <Label htmlFor="tx-fee">Fee</Label>
              <Input
                id="tx-fee"
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={form.fee}
                onChange={(e) => setForm({ ...form, fee: e.target.value })}
              />
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
              <Label htmlFor="tx-notes">Notes</Label>
              <Input
                id="tx-notes"
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
                Add Transaction
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
