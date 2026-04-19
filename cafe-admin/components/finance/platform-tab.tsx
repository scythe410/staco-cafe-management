'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { usePlatformEarnings, type DateRange } from '@/hooks/useFinance'
import { ORDER_SOURCE_COLORS } from '@/constants/orders'
import type { OrderSource } from '@/constants/orders'

interface PlatformTabProps {
  range: DateRange
}

export function PlatformTab({ range }: PlatformTabProps) {
  const { data: platforms, isLoading, isError } = usePlatformEarnings(range)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="h-[300px] animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (isError) {
    return <p className="text-sm text-destructive py-8 text-center">Failed to load platform data</p>
  }

  if (!platforms || platforms.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No platform orders for this period</p>
      </div>
    )
  }

  // Chart data
  const chartData = platforms.map((p) => ({
    name: p.label,
    'Gross Sales': p.grossSales,
    Commission: p.commission,
    'Net Received': p.netReceived,
  }))

  return (
    <div className="space-y-6">
      {/* Platform cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {platforms.map((p) => (
          <Card key={p.source}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    ORDER_SOURCE_COLORS[p.source as OrderSource]
                  }`}
                >
                  {p.label}
                </span>
                <span className="text-xs text-muted-foreground font-normal">
                  {p.orderCount} orders
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Gross Sales</p>
                  <p className="font-semibold mt-0.5">{formatCurrency(p.grossSales)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Commission</p>
                  <p className="font-semibold text-destructive mt-0.5">
                    -{formatCurrency(p.commission)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Net Received</p>
                  <p className="font-semibold text-emerald-600 mt-0.5">
                    {formatCurrency(p.netReceived)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground font-medium">
            Platform Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="name"
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
                  formatter={(value) => [formatCurrency(value as number)]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Gross Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Commission" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Net Received" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
