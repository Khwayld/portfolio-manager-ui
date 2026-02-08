import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { usePortfolios, useCreatePortfolio, useDeletePortfolio } from "@/hooks/use-portfolios"
import { CURRENCIES } from "@/lib/constants"
import { formatDate } from "@/lib/utils"
import { Plus, Trash2, Briefcase, ArrowRight } from "lucide-react"

export default function PortfolioPage() {
  const navigate = useNavigate()
  const { data: portfolios, isLoading, error } = usePortfolios()
  const createPortfolio = useCreatePortfolio()
  const deletePortfolio = useDeletePortfolio()

  const [createOpen, setCreateOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Create form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [baseCurrency, setBaseCurrency] = useState("KWD")
  const [isDefault, setIsDefault] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const resetForm = () => {
    setName("")
    setDescription("")
    setBaseCurrency("KWD")
    setIsDefault(false)
    setCreateError(null)
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      setCreateError("Portfolio name is required")
      return
    }

    try {
      setCreateError(null)
      await createPortfolio.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        baseCurrency,
        isDefault,
      })
      setCreateOpen(false)
      resetForm()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create portfolio")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deletePortfolio.mutateAsync(id)
      setDeleteConfirmId(null)
    } catch (err) {
      console.error("Failed to delete portfolio:", err)
    }
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Portfolios"
          description="Manage your investment portfolios"
        />
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <PageHeader
          title="Portfolios"
          description="Manage your investment portfolios"
        />
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              Failed to load portfolios. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const portfolioList = portfolios ?? []

  return (
    <div>
      <PageHeader
        title="Portfolios"
        description="Manage your investment portfolios"
        actions={
          <Dialog
            open={createOpen}
            onOpenChange={(open) => {
              setCreateOpen(open)
              if (!open) resetForm()
            }}
          >
            <DialogTrigger>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Portfolio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Portfolio</DialogTitle>
                <DialogDescription>
                  Add a new investment portfolio to track your assets.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Growth Portfolio"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Optional description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currency">Base Currency</Label>
                  <Select value={baseCurrency} onValueChange={setBaseCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="isDefault"
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isDefault">Set as default portfolio</Label>
                </div>
                {createError && (
                  <p className="text-sm text-destructive">{createError}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreateOpen(false)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={createPortfolio.isPending}
                >
                  {createPortfolio.isPending ? "Creating..." : "Create Portfolio"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {portfolioList.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-dashed">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-muted-foreground">No portfolios yet</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create your first portfolio to start tracking investments.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {portfolioList.map((portfolio) => (
            <Card
              key={portfolio.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => navigate(`/portfolios/${portfolio.id}`)}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {portfolio.name}
                    {portfolio.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </CardTitle>
                  {portfolio.description && (
                    <CardDescription>{portfolio.description}</CardDescription>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteConfirmId(portfolio.id)
                  }}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">
                      Currency: <span className="font-medium text-foreground">{portfolio.baseCurrency}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Created: <span className="font-medium text-foreground">{formatDate(portfolio.createdAt)}</span>
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Portfolio</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this portfolio? This action cannot be undone.
              All holdings and transactions associated with this portfolio will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deletePortfolio.isPending}
            >
              {deletePortfolio.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
