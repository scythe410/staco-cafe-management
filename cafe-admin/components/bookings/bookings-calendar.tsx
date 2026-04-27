'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBookingsByMonth } from '@/hooks/useBookings'
import { cn, toSLDateString, startOfTodaySL } from '@/lib/utils'
import { format, parse } from 'date-fns'
import { BOOKING_STATUS_COLORS, type BookingStatus } from '@/constants/bookings'

interface BookingsCalendarProps {
  onSelectDate: (dateStr: string) => void
}

function trimSeconds(t: string): string {
  return t.length >= 5 ? t.slice(0, 5) : t
}

export function BookingsCalendar({ onSelectDate }: BookingsCalendarProps) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { y: now.getFullYear(), m: now.getMonth() }
  })

  const { data: bookings } = useBookingsByMonth(cursor.y, cursor.m)
  const today = toSLDateString(startOfTodaySL())

  // Group by date
  const byDate = new Map<string, typeof bookings>()
  for (const b of bookings ?? []) {
    const list = byDate.get(b.booking_date) ?? []
    list.push(b)
    byDate.set(b.booking_date, list)
  }

  // Build calendar grid
  const firstOfMonth = new Date(Date.UTC(cursor.y, cursor.m, 1))
  const startDay = firstOfMonth.getUTCDay()  // 0=Sun
  const daysInMonth = new Date(Date.UTC(cursor.y, cursor.m + 1, 0)).getUTCDate()

  const cells: ({ date: string; day: number } | null)[] = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ date, day: d })
  }
  while (cells.length % 7 !== 0) cells.push(null)

  function prev() {
    setCursor((c) => c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 })
  }
  function next() {
    setCursor((c) => c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 })
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          {format(new Date(cursor.y, cursor.m, 1), 'MMMM yyyy')}
        </h3>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={prev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={next}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center font-semibold text-muted-foreground py-1">
            {d}
          </div>
        ))}

        {cells.map((cell, i) => {
          if (!cell) return <div key={i} className="aspect-square" />
          const dayBookings = byDate.get(cell.date) ?? []
          const isToday = cell.date === today

          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onSelectDate(cell.date)}
              className={cn(
                'aspect-square rounded-md border p-1 flex flex-col items-start text-left transition-colors',
                'hover:bg-accent',
                isToday && 'border-primary',
              )}
            >
              <span className={cn(
                'text-xs font-medium',
                isToday && 'text-primary',
              )}>
                {cell.day}
              </span>
              <div className="mt-auto w-full space-y-0.5">
                {dayBookings.slice(0, 2).map((b) => (
                  <div
                    key={b.id}
                    className={cn(
                      'truncate rounded px-1 py-0.5 text-[9px] leading-tight',
                      BOOKING_STATUS_COLORS[b.status as BookingStatus],
                    )}
                    title={`${b.booking_code} · ${b.customer_name}`}
                  >
                    {format(parse(trimSeconds(b.start_time), 'HH:mm', new Date()), 'h:mma')}
                  </div>
                ))}
                {dayBookings.length > 2 && (
                  <p className="text-[9px] text-muted-foreground">
                    +{dayBookings.length - 2} more
                  </p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
