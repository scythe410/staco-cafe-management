'use client'

import Link from 'next/link'
import { CalendarCheck, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTodaysBookings } from '@/hooks/useBookings'
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_COLORS,
  type BookingStatus,
} from '@/constants/bookings'
import { cn } from '@/lib/utils'
import { format, parse } from 'date-fns'

function trimSeconds(t: string): string {
  return t.length >= 5 ? t.slice(0, 5) : t
}

function fmtTime(t: string): string {
  return format(parse(trimSeconds(t), 'HH:mm', new Date()), 'h:mm a')
}

export function TodaysBookings() {
  const { data: bookings, isLoading, isError } = useTodaysBookings()
  const count = bookings?.length ?? 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <CalendarCheck className="h-4 w-4" />
          Today&apos;s Bookings
          {!isLoading && !isError && count > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {count}
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
          <p className="text-sm text-destructive">Failed to load bookings</p>
        ) : count === 0 ? (
          <p className="text-sm text-muted-foreground">No bookings scheduled for today</p>
        ) : (
          <div className="space-y-3">
            {bookings!.slice(0, 5).map((b) => (
              <Link
                key={b.id}
                href="/bookings"
                className="flex items-center justify-between rounded-md hover:bg-accent/40 -mx-2 px-2 py-1.5 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{b.customer_name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{fmtTime(b.start_time)} – {fmtTime(b.end_time)}</span>
                    <span className="inline-flex items-center gap-0.5">
                      <Users className="h-3 w-3" />
                      {b.party_size}
                    </span>
                  </p>
                </div>
                <span className={cn(
                  'shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                  BOOKING_STATUS_COLORS[b.status as BookingStatus],
                )}>
                  {BOOKING_STATUS_LABELS[b.status as BookingStatus]}
                </span>
              </Link>
            ))}
            {count > 5 && (
              <Link
                href="/bookings"
                className="block text-xs text-muted-foreground hover:text-foreground text-center pt-1"
              >
                +{count - 5} more — view all
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
