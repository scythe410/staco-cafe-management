'use client'

import { useState } from 'react'
import { Search, Plus, Users, Printer } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useBookings, useBooking, type BookingFilters } from '@/hooks/useBookings'
import { formatCurrency, cn, toSLDateString, startOfTodaySL } from '@/lib/utils'
import {
  BOOKING_STATUS,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_COLORS,
  BOOKING_SOURCE,
  BOOKING_SOURCE_LABELS,
  type BookingStatus,
  type BookingSource,
} from '@/constants/bookings'
import { format, parse, differenceInDays } from 'date-fns'
import { BookingFormDialog } from './booking-form-dialog'
import { BookingDetailDialog } from './booking-detail-dialog'
import { BookingsCalendar } from './bookings-calendar'
import { ROLES, type Role } from '@/constants/roles'
import {
  getBookingReceiptHtml,
  getBookingPrintTitle,
  BOOKING_RECEIPT_STYLES,
} from './booking-receipt'
import { toast } from 'sonner'

const ALL = 'all'

interface BookingsTableProps {
  userRole: Role
}

function trimSeconds(t: string): string {
  return t.length >= 5 ? t.slice(0, 5) : t
}

type ViewTab = 'upcoming' | 'today' | 'calendar' | 'past' | 'all' | 'archived'

export function BookingsTable({ userRole }: BookingsTableProps) {
  const canCreate = userRole === ROLES.OWNER || userRole === ROLES.MANAGER || userRole === ROLES.CASHIER
  const [view, setView] = useState<ViewTab>('upcoming')
  const [calendarDate, setCalendarDate] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>(ALL)
  const [sourceFilter, setSourceFilter] = useState<BookingSource | 'all'>(ALL)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [printingId, setPrintingId] = useState<string | null>(null)

  // Active view filter
  const isArchivedView = view === 'archived'
  const filters: BookingFilters = {
    view: isArchivedView
      ? 'all'
      : view === 'calendar' && calendarDate
        ? 'date'
        : view === 'calendar'
          ? 'all'
          : view,
    date: view === 'calendar' && calendarDate ? calendarDate : undefined,
    status: statusFilter,
    source: sourceFilter,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    search: search.trim() || undefined,
    archived: isArchivedView,
  }

  const { data: bookings, isLoading, isError } = useBookings(filters)

  // For the print-from-row action — fetch detail on demand
  const { data: printingBooking } = useBooking(printingId)
  if (printingBooking && printingId) {
    // Fire print, then clear
    const html = getBookingReceiptHtml(printingBooking)
    const title = getBookingPrintTitle(printingBooking)
    const w = window.open('', '_blank', 'width=400,height=700')
    if (!w) {
      toast.error('Popup blocked. Please allow popups for this site and try again.')
    } else {
      w.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8" /><title>${title}</title>
<style>${BOOKING_RECEIPT_STYLES}</style></head>
<body>${html}
<script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };</script>
</body></html>`)
      w.document.close()
    }
    setPrintingId(null)
  }

  const today = toSLDateString(startOfTodaySL())

  return (
    <Tabs value={view} onValueChange={(v) => setView(v as ViewTab)} className="space-y-4">
      {/* View tabs + new booking */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>

        {canCreate && !isArchivedView && (
          <BookingFormDialog
            trigger={
              <Button className="h-11 gap-1.5">
                <Plus className="h-4 w-4" />
                New Booking
              </Button>
            }
          />
        )}
      </div>

      {/* Calendar view */}
      {view === 'calendar' && (
        <div className="space-y-4">
          <BookingsCalendar onSelectDate={(d) => setCalendarDate(d)} />
          {calendarDate && (
            <div className="flex items-center justify-between text-sm">
              <p>
                Showing bookings for{' '}
                <span className="font-semibold">
                  {format(new Date(calendarDate + 'T00:00:00'), 'dd MMM yyyy')}
                </span>
              </p>
              <Button variant="outline" size="sm" onClick={() => setCalendarDate(null)}>
                Clear date
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BookingStatus | 'all')}>
          <SelectTrigger className="w-[160px] h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {Object.values(BOOKING_STATUS).map((s) => (
              <SelectItem key={s} value={s}>{BOOKING_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as BookingSource | 'all')}>
          <SelectTrigger className="w-[140px] h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All sources</SelectItem>
            {Object.values(BOOKING_SOURCE).map((s) => (
              <SelectItem key={s} value={s}>{BOOKING_SOURCE_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[150px] h-10" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[150px] h-10" />
      </div>

      {/* Table */}
      <TabsContent value={view} forceMount>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-destructive py-8 text-center">Failed to load bookings</p>
        ) : (
          <div className="rounded-lg border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-center">Party</TableHead>
                  <TableHead>Date &amp; Time</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!bookings || bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-12">
                      <div className="space-y-1">
                        <p className="font-medium">No bookings found</p>
                        <p className="text-xs">Try a different view or clear filters.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((b) => {
                    const itemCount = b.booking_items?.[0]?.count ?? 0
                    const dateObj = new Date(b.booking_date + 'T00:00:00')
                    const daysAway = differenceInDays(dateObj, new Date(today + 'T00:00:00'))
                    const balanceUrgent = b.balance_due > 0 && daysAway >= 0 && daysAway <= 2
                    const followUp = b.balance_due > 0 && daysAway < -7
                    return (
                      <TableRow
                        key={b.id}
                        className={cn(
                          'cursor-pointer hover:bg-accent/50 min-h-[44px]',
                          b.is_archived && 'text-muted-foreground italic',
                        )}
                        onClick={() => setSelectedId(b.id)}
                      >
                        <TableCell className="font-mono text-xs">{b.booking_code}</TableCell>
                        <TableCell>
                          <p className="font-medium">{b.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{b.customer_phone}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            {b.party_size}
                          </span>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{format(dateObj, 'dd MMM yyyy')}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parse(trimSeconds(b.start_time), 'HH:mm', new Date()), 'h:mm a')}
                            {' – '}
                            {format(parse(trimSeconds(b.end_time), 'HH:mm', new Date()), 'h:mm a')}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm">{b.table_or_area || '—'}</TableCell>
                        <TableCell className="text-center">{itemCount}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {formatCurrency(b.total_amount)}
                        </TableCell>
                        <TableCell className={cn(
                          'text-right whitespace-nowrap',
                          balanceUrgent && 'text-destructive font-semibold',
                        )}>
                          {b.balance_due > 0 ? formatCurrency(b.balance_due) : '—'}
                          {followUp && (
                            <p className="text-[10px] text-amber-700 mt-0.5">Follow up</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            BOOKING_STATUS_COLORS[b.status as BookingStatus],
                          )}>
                            {BOOKING_STATUS_LABELS[b.status as BookingStatus]}
                          </span>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => setPrintingId(b.id)}
                            title="Print receipt"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      <BookingDetailDialog
        bookingId={selectedId}
        open={!!selectedId}
        onOpenChange={(open) => { if (!open) setSelectedId(null) }}
        userRole={userRole}
      />
    </Tabs>
  )
}
