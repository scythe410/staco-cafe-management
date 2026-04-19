'use client'

import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLowStockItems } from '@/hooks/useDashboard'

export function LowStockAlert() {
  const { data: items, isLoading, isError } = useLowStockItems()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Low Stock Alerts
          {!isLoading && !isError && (items?.length ?? 0) > 0 && (
            <Badge variant="destructive" className="ml-auto text-xs">
              {items!.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-destructive">Failed to load stock data</p>
        ) : items && items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Min: {item.min_stock_level} {item.unit}
                  </p>
                </div>
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  {item.quantity} {item.unit}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">All stock levels are healthy</p>
        )}
      </CardContent>
    </Card>
  )
}
