'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import {
  useFinanceSummary,
  useRevenueByDay,
  usePaymentMethodSplit,
  useMonthComparison,
  type DatePreset,
  type DateRange,
} from '@/hooks/useFinance'
import { DateRangePicker } from './date-range-picker'

interface OverviewTabProps {
  range: DateRange
  preset: DatePreset
  onPresetChange: (preset: DatePreset) => void
  customRange: DateRange
  onCustomRangeChange: (range: DateRange) => void
}

export function OverviewTab({
  range,
  preset,
  onPresetChange,
  customRange,
  onCustomRangeChange,
}: OverviewTabProps) {
  const { data: summary, isLoading: loadingSummary } = useFinanceSummary(range)
  const { data: revenueData, isLoading: loadingRevenue } = useRevenueByDay(range)
  const { data: paymentData, isLoading: loadingPayment } = usePaymentMethodSplit(range)
  const { data: comparison, isLoading: loadingComparison } = useMonthComparison()

  return (
    <div className="space-y-6">
      <DateRangePicker
        preset={preset}
        onPresetChange={onPresetChange}
        customRange={customRange}
        onCustomRangeChange={onCustomRangeChange}
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Income"
          value={summary?.totalIncome}
          loading={loadingSummary}
          className="text-emerald-600"
        />
        <KpiCard
          label="Total Expenses"
          value={summary?.totalExpenses}
          loading={loadingSummary}
          className="text-destructive"
        />
        <KpiCard
          label="Net Profit"
          value={summary?.netProfit}
          loading={loadingSummary}
          className={summary && summary.netProfit >= 0 ? 'text-emerald-600' : 'text-destructive'}
        />
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground font-medium">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <div className="h-7 w-20 animate-pulse rounded bg-muted" />
            ) : (
              <p className="text-2xl font-semibold">{summary?.totalOrders ?? 0}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue by day */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Revenue by Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRevenue ? (
              <div className="h-[260px] flex items-end gap-2 px-8">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 animate-pulse rounded-t bg-muted"
                    style={{ height: `${40 + Math.random() * 60}%` }}
                  />
                ))}
              </div>
            ) : revenueData && revenueData.length > 0 ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                      tickFormatter={(v: number) => `${(v / 100_000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value as number), 'Revenue']}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="revenue" fill="#18181b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[260px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No revenue data for this period</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment method split */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPayment ? (
              <div className="h-[260px] flex items-center justify-center">
                <div className="h-[170px] w-[170px] animate-pulse rounded-full bg-muted" />
              </div>
            ) : paymentData && paymentData.length > 0 ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      dataKey="value"
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {paymentData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [formatCurrency(value as number), 'Amount']}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[260px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No payment data for this period</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Month-over-month comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground font-medium">
            Month-over-Month Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingComparison ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : comparison ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <ComparisonItem
                label="Income"
                current={comparison.currentIncome}
                previous={comparison.previousIncome}
                growth={comparison.incomeGrowth}
                positiveIsGood
              />
              <ComparisonItem
                label="Expenses"
                current={comparison.currentExpenses}
                previous={comparison.previousExpenses}
                growth={comparison.expenseGrowth}
                positiveIsGood={false}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function KpiCard({
  label,
  value,
  loading,
  className,
}: {
  label: string
  value: number | undefined
  loading: boolean
  className?: string
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-xs text-muted-foreground font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-7 w-28 animate-pulse rounded bg-muted" />
        ) : (
          <p className={`text-2xl font-semibold ${className ?? ''}`}>
            {formatCurrency(value ?? 0)}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function ComparisonItem({
  label,
  current,
  previous,
  growth,
  positiveIsGood,
}: {
  label: string
  current: number
  previous: number
  growth: number | null
  positiveIsGood: boolean
}) {
  const isPositive = growth !== null && growth >= 0
  const isGood = positiveIsGood ? isPositive : !isPositive
  const Icon = isPositive ? TrendingUp : TrendingDown

  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-3">
        <span className="text-xl font-semibold">{formatCurrency(current)}</span>
        {growth !== null && (
          <span
            className={`inline-flex items-center gap-1 text-sm font-medium ${
              isGood ? 'text-emerald-600' : 'text-destructive'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {Math.abs(growth).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Previous: {formatCurrency(previous)}
      </p>
    </div>
  )
}
