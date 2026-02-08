import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { PageHeader } from "@/components/common/page-header"
import { CurrencyDisplay } from "@/components/common/currency-display"
import { PercentageBadge } from "@/components/common/percentage-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { portfoliosApi } from "@/api/portfolios.api"
import { usePortfolioSummary, useAllocation, usePerformance, useSharpe } from "@/hooks/use-analytics"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Portfolio } from "@/types"

export default function DashboardPage() {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>("")

  const {
    data: portfolios,
    isLoading: portfoliosLoading,
    error: portfoliosError,
  } = useQuery({
    queryKey: ["portfolios"],
    queryFn: portfoliosApi.list,
  })

  // Default to first portfolio when loaded
  const portfolioList = portfolios ?? []
  const activePortfolioId =
    selectedPortfolioId || (portfolioList.length > 0 ? portfolioList[0].id : "")
  const activePortfolio = portfolioList.find(
    (p: Portfolio) => p.id === activePortfolioId
  )

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = usePortfolioSummary(activePortfolioId)

  const {
    data: allocation,
    isLoading: allocationLoading,
    error: allocationError,
  } = useAllocation(activePortfolioId, "assetClass")

  const {
    data: performance,
    isLoading: performanceLoading,
    error: performanceError,
  } = usePerformance(activePortfolioId)

  const {
    data: sharpe,
    isLoading: sharpeLoading,
    error: sharpeError,
  } = useSharpe(activePortfolioId)

  const currency = activePortfolio?.baseCurrency ?? "KWD"

  // Loading state for portfolios
  if (portfoliosLoading) {
    return (
      <div>
        <PageHeader
          title="Dashboard"
          description="Overview of your investment portfolio"
        />
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  // Error fetching portfolios
  if (portfoliosError) {
    return (
      <div>
        <PageHeader
          title="Dashboard"
          description="Overview of your investment portfolio"
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

  // No portfolios exist
  if (portfolioList.length === 0) {
    return (
      <div>
        <PageHeader
          title="Dashboard"
          description="Overview of your investment portfolio"
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              Create a portfolio to see your dashboard
            </p>
            <Link
              to="/portfolios"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              Go to Portfolios
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderLoadingSpinner = () => (
    <div className="flex items-center justify-center py-8">
      <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )

  // Custom tooltip for the performance chart
  const PerformanceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-3 shadow-sm">
          <p className="text-sm font-medium">{formatDate(label)}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(payload[0].value, currency)}
          </p>
        </div>
      )
    }
    return null
  }

  // Custom label renderer for pie chart
  const renderPieLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percentage,
  }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 1.6
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    if (percentage < 3) return null

    return (
      <text
        x={x}
        y={y}
        fill="currentColor"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs fill-foreground"
      >
        {`${percentage.toFixed(1)}%`}
      </text>
    )
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your investment portfolio"
        actions={
          <Select
            value={activePortfolioId}
            onValueChange={setSelectedPortfolioId}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select portfolio" />
            </SelectTrigger>
            <SelectContent>
              {portfolioList.map((portfolio: Portfolio) => (
                <SelectItem key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* Summary cards row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              renderLoadingSpinner()
            ) : summaryError ? (
              <p className="text-sm text-muted-foreground">--</p>
            ) : (
              <CurrencyDisplay
                amount={summary?.totalValue ?? 0}
                currency={currency}
                className="text-2xl font-bold"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              renderLoadingSpinner()
            ) : summaryError ? (
              <p className="text-sm text-muted-foreground">--</p>
            ) : (
              <CurrencyDisplay
                amount={summary?.totalCost ?? 0}
                currency={currency}
                className="text-2xl font-bold"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              renderLoadingSpinner()
            ) : summaryError ? (
              <p className="text-sm text-muted-foreground">--</p>
            ) : (
              <div>
                <CurrencyDisplay
                  amount={summary?.totalGainLoss ?? 0}
                  currency={currency}
                  colored
                  className="text-2xl font-bold"
                />
                <PercentageBadge
                  value={summary?.totalGainLossPct ?? 0}
                  className="mt-1"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Day Change</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              renderLoadingSpinner()
            ) : summaryError ? (
              <p className="text-sm text-muted-foreground">--</p>
            ) : (
              <div>
                <CurrencyDisplay
                  amount={summary?.dayChange ?? 0}
                  currency={currency}
                  colored
                  className="text-2xl font-bold"
                />
                <PercentageBadge
                  value={summary?.dayChangePct ?? 0}
                  className="mt-1"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            {sharpeLoading ? (
              renderLoadingSpinner()
            ) : sharpeError ? (
              <p className="text-sm text-muted-foreground">--</p>
            ) : (
              <div>
                <div className="text-2xl font-bold">
                  {(sharpe?.sharpeRatio ?? 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Return {((sharpe?.annualizedReturn ?? 0) * 100).toFixed(1)}% · Vol {((sharpe?.annualizedVolatility ?? 0) * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {/* Asset Allocation - Donut Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            {allocationLoading ? (
              renderLoadingSpinner()
            ) : allocationError || !allocation || allocation.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">
                  No holdings yet
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={allocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    dataKey="value"
                    nameKey="label"
                    label={renderPieLabel}
                    labelLine={false}
                  >
                    {allocation.map((item, index) => (
                      <Cell key={`cell-${index}`} fill={item.color} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value: string) => (
                      <span className="text-xs text-foreground">{value}</span>
                    )}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="rounded-lg border bg-background p-3 shadow-sm">
                            <p className="text-sm font-medium">{data.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(data.value, currency)} ({data.percentage.toFixed(1)}%)
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Performance - Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {performanceLoading ? (
              renderLoadingSpinner()
            ) : performanceError || !performance || performance.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">
                  No performance data yet
                </p>
              </div>
            ) : (
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performance}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date: string) => {
                        const d = new Date(date)
                        return `${d.getMonth() + 1}/${d.getDate()}`
                      }}
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      tickFormatter={(value: number) =>
                        formatCurrency(value, currency)
                      }
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                      width={90}
                    />
                    <Tooltip content={<PerformanceTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={performance.length < 3 ? { r: 4, fill: "#3B82F6" } : false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                {performance.length === 1 && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Performance tracking started — chart will populate over time
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
