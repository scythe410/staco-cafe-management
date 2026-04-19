'use client'

import { TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { useTodayProfitEstimate } from '@/hooks/useDashboard'

export function ProfitEstimate() {
  const { data: profit, isLoading, isError } = useTodayProfitEstimate()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <TrendingUp className="h-4 w-4" />
          Est. Net Profit Today
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-9 w-44 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
        ) : isError ? (
          <p className="text-sm text-destructive">Failed to load profit data</p>
        ) : (
          <>
            <p className={`text-3xl font-semibold tracking-tight ${(profit?.net ?? 0) >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
              {formatCurrency(profit?.net ?? 0)}
            </p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Income</span>
                <span>{formatCurrency(profit?.income ?? 0)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Expenses</span>
                <span>{formatCurrency(profit?.expenses ?? 0)}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
