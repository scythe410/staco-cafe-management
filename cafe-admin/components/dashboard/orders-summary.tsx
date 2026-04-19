'use client'

import { ShoppingCart, CheckCircle, Clock, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTodayOrderCounts } from '@/hooks/useDashboard'

interface StatItemProps {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}

function StatItem({ icon, label, value, color }: StatItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-md ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

export function OrdersSummary() {
  const { data: counts, isLoading, isError } = useTodayOrderCounts()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <ShoppingCart className="h-4 w-4" />
          Orders Today
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-destructive">Failed to load orders</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <StatItem
              icon={<ShoppingCart className="h-4 w-4 text-primary" />}
              label="Total"
              value={counts?.total ?? 0}
              color="bg-primary/10"
            />
            <StatItem
              icon={<CheckCircle className="h-4 w-4 text-emerald-600" />}
              label="Completed"
              value={counts?.completed ?? 0}
              color="bg-emerald-50"
            />
            <StatItem
              icon={<Clock className="h-4 w-4 text-amber-600" />}
              label="Pending"
              value={counts?.pending ?? 0}
              color="bg-amber-50"
            />
            <StatItem
              icon={<XCircle className="h-4 w-4 text-destructive" />}
              label="Cancelled"
              value={counts?.cancelled ?? 0}
              color="bg-red-50"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
