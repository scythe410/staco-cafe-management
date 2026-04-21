'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { useRevenueTrend } from '@/hooks/useDashboard'

export function RevenueTrend() {
  const { data: trendData, isLoading, isError } = useRevenueTrend()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground font-medium">
          Revenue — Last 7 Days
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[260px] flex items-end gap-2 px-8">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 animate-pulse rounded-t bg-muted"
                style={{ height: `${40 + Math.random() * 60}%` }}
              />
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-destructive">Failed to load revenue data</p>
        ) : (
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2DDD7" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#7A6658' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#7A6658' }}
                  tickFormatter={(value: number) => `${(value / 100_000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(value as number), 'Revenue']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="revenue" fill="#8B4513" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
