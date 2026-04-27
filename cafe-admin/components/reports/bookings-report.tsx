'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useBookingsReport } from '@/hooks/useBookings'
import { formatCurrency, downloadCSV, printReport } from '@/lib/utils'
import {
  BOOKING_STATUS_LABELS,
  BOOKING_SOURCE_LABELS,
  type BookingStatus,
  type BookingSource,
} from '@/constants/bookings'
import { format, parse } from 'date-fns'
import { ExportButtons } from './export-buttons'

function trimSeconds(t: string): string {
  return t.length >= 5 ? t.slice(0, 5) : t
}

function fmtTime(t: string): string {
  return format(parse(trimSeconds(t), 'HH:mm', new Date()), 'h:mm a')
}

interface BookingsReportProps {
  from: string
  to: string
}

export function BookingsReport({ from, to }: BookingsReportProps) {
  const { data, isLoading, isError } = useBookingsReport(from, to)

  function handleExportCSV() {
    if (!data) return
    const headers = ['Code', 'Customer', 'Phone', 'Date', 'Start', 'End', 'Party', 'Occasion', 'Source', 'Status', 'Total (LKR)', 'Deposit (LKR)', 'Balance (LKR)']
    const rows = data.rows.map((r) => [
      r.booking_code,
      r.customer_name,
      r.customer_phone,
      r.booking_date,
      trimSeconds(r.start_time),
      trimSeconds(r.end_time),
      r.party_size.toString(),
      r.occasion ?? '',
      BOOKING_SOURCE_LABELS[r.source as BookingSource] ?? r.source,
      BOOKING_STATUS_LABELS[r.status as BookingStatus] ?? r.status,
      (r.total_amount / 100).toFixed(2),
      (r.deposit_paid / 100).toFixed(2),
      (r.balance_due / 100).toFixed(2),
    ])
    downloadCSV(headers, rows, `bookings-${from}-to-${to}.csv`)
  }

  function handlePrint() {
    if (!data) return
    const rangeLabel = `${format(new Date(from + 'T00:00:00'), 'dd MMM yyyy')} – ${format(new Date(to + 'T00:00:00'), 'dd MMM yyyy')}`

    const rows = data.rows.map((r) => `
      <tr>
        <td>${r.booking_code}</td>
        <td>${r.customer_name}</td>
        <td>${format(new Date(r.booking_date + 'T00:00:00'), 'dd MMM')}</td>
        <td>${fmtTime(r.start_time)}</td>
        <td class="num">${r.party_size}</td>
        <td>${r.occasion ?? '—'}</td>
        <td>${BOOKING_STATUS_LABELS[r.status as BookingStatus] ?? r.status}</td>
        <td class="num">${formatCurrency(r.total_amount)}</td>
        <td class="num">${formatCurrency(r.balance_due)}</td>
      </tr>
    `).join('')

    printReport(`Bookings — ${rangeLabel}`, `
      <h1>Bookings Report</h1>
      <h2>${rangeLabel}</h2>
      <div class="summary">
        <p><strong>Total Bookings:</strong> ${data.summary.totalBookings}</p>
        <p><strong>Completed Revenue:</strong> ${formatCurrency(data.summary.totalRevenue)}</p>
        <p><strong>Average Party Size:</strong> ${data.summary.averagePartySize}</p>
        <p><strong>Top Occasion:</strong> ${data.summary.topOccasion}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Code</th><th>Customer</th><th>Date</th><th>Time</th>
            <th class="num">Party</th><th>Occasion</th><th>Status</th>
            <th class="num">Total</th><th class="num">Balance</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `)
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-muted" />
        ))}
      </div>
    )
  }

  if (isError) return <p className="text-sm text-destructive py-8 text-center">Failed to load report</p>
  if (!data) return null

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Bookings" value={String(data.summary.totalBookings)} />
        <KpiCard label="Completed Revenue" value={formatCurrency(data.summary.totalRevenue)} className="text-emerald-600" />
        <KpiCard label="Avg Party Size" value={String(data.summary.averagePartySize)} />
        <KpiCard label="Top Occasion" value={data.summary.topOccasion} />
      </div>

      <ExportButtons onCSV={handleExportCSV} onPrint={handlePrint} />

      <div className="rounded-lg border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-center">Party</TableHead>
              <TableHead>Occasion</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No bookings in this date range
                </TableCell>
              </TableRow>
            ) : (
              data.rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.booking_code}</TableCell>
                  <TableCell>
                    <p className="font-medium">{r.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{r.customer_phone}</p>
                  </TableCell>
                  <TableCell>{format(new Date(r.booking_date + 'T00:00:00'), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="text-xs">{fmtTime(r.start_time)} – {fmtTime(r.end_time)}</TableCell>
                  <TableCell className="text-center">{r.party_size}</TableCell>
                  <TableCell className="text-sm">{r.occasion ?? '—'}</TableCell>
                  <TableCell className="text-sm">{BOOKING_STATUS_LABELS[r.status as BookingStatus] ?? r.status}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.total_amount)}</TableCell>
                  <TableCell className="text-right">
                    {r.balance_due > 0 ? formatCurrency(r.balance_due) : '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function KpiCard({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-xs text-muted-foreground font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-xl font-semibold ${className ?? ''}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
