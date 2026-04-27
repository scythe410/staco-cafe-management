'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, CalendarRange, Wallet, CalendarCheck } from 'lucide-react'
import { useBookingStats } from '@/hooks/useBookings'
import { formatCurrency } from '@/lib/utils'

export function BookingsStats() {
  const { data, isLoading } = useBookingStats()

  const stats = [
    {
      label: "Today's bookings",
      icon: CalendarDays,
      value: isLoading ? '—' : String(data?.todayCount ?? 0),
    },
    {
      label: 'This week',
      icon: CalendarRange,
      value: isLoading ? '—' : String(data?.weekCount ?? 0),
    },
    {
      label: 'Pending balance due',
      icon: Wallet,
      value: isLoading ? '—' : formatCurrency(data?.pendingBalanceDue ?? 0),
      muted: (data?.pendingBalanceDue ?? 0) === 0,
    },
    {
      label: 'Upcoming this month',
      icon: CalendarCheck,
      value: isLoading ? '—' : String(data?.monthCount ?? 0),
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <s.icon className="h-3.5 w-3.5" />
              {s.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={s.muted ? 'text-lg font-semibold text-muted-foreground' : 'text-lg font-semibold'}>
              {s.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
