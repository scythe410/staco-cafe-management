'use client'

import { DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { useTodaySales } from '@/hooks/useDashboard'

export function SalesCard() {
  const { data: totalCents, isLoading, isError } = useTodaySales()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <DollarSign className="h-4 w-4" />
          Today&apos;s Sales
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-9 w-40 animate-pulse rounded bg-muted" />
        ) : isError ? (
          <p className="text-sm text-destructive">Failed to load sales</p>
        ) : (
          <p className="text-3xl font-semibold tracking-tight">
            {formatCurrency(totalCents ?? 0)}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
