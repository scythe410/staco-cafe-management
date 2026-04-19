'use client'

import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDailySalesReport } from '@/hooks/useReports'
import { formatCurrency, downloadCSV, printReport } from '@/lib/utils'
import {
  ORDER_SOURCE_LABELS,
  ORDER_SOURCE_COLORS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VARIANT,
  PAYMENT_METHOD_LABELS,
  type OrderSource,
  type OrderStatus,
  type PaymentMethod,
} from '@/constants/orders'
import { format } from 'date-fns'
import { ExportButtons } from './export-buttons'

interface DailySalesReportProps {
  date: string
}

export function DailySalesReport({ date }: DailySalesReportProps) {
  const { data, isLoading, isError } = useDailySalesReport(date)

  function handleExportCSV() {
    if (!data) return
    const headers = ['Order ID', 'Time', 'Source', 'Customer', 'Items', 'Total', 'Commission', 'Payment', 'Status']
    const rows = data.rows.map((r) => [
      r.id.slice(0, 8),
      format(new Date(r.created_at), 'HH:mm'),
      ORDER_SOURCE_LABELS[r.source],
      r.customer_name ?? '',
      r.item_count.toString(),
      (r.total_amount / 100).toFixed(2),
      (r.commission / 100).toFixed(2),
      r.payment_method ? PAYMENT_METHOD_LABELS[r.payment_method] : '',
      ORDER_STATUS_LABELS[r.status as OrderStatus],
    ])
    downloadCSV(headers, rows, `daily-sales-${date}.csv`)
  }

  function handlePrint() {
    if (!data) return
    const t = data.totals
    const tableRows = data.rows.map((r) => `
      <tr>
        <td>${format(new Date(r.created_at), 'HH:mm')}</td>
        <td>${ORDER_SOURCE_LABELS[r.source]}</td>
        <td>${r.customer_name ?? '—'}</td>
        <td class="num">${r.item_count}</td>
        <td class="num">${formatCurrency(r.total_amount)}</td>
        <td class="num">${formatCurrency(r.commission)}</td>
        <td>${r.payment_method ? PAYMENT_METHOD_LABELS[r.payment_method] : '—'}</td>
        <td>${ORDER_STATUS_LABELS[r.status as OrderStatus]}</td>
      </tr>
    `).join('')

    printReport(`Daily Sales — ${date}`, `
      <h1>Daily Sales Report</h1>
      <h2>${format(new Date(date), 'dd MMMM yyyy')}</h2>
      <div class="summary">
        <p><strong>Total Revenue:</strong> ${formatCurrency(t.totalRevenue)}</p>
        <p><strong>Total Commission:</strong> ${formatCurrency(t.totalCommission)}</p>
        <p><strong>Net Revenue:</strong> ${formatCurrency(t.netRevenue)}</p>
        <p><strong>Completed Orders:</strong> ${t.orderCount}</p>
      </div>
      <table>
        <thead><tr>
          <th>Time</th><th>Source</th><th>Customer</th>
          <th class="num">Items</th><th class="num">Total</th><th class="num">Commission</th>
          <th>Payment</th><th>Status</th>
        </tr></thead>
        <tbody>${tableRows}</tbody>
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

  if (isError) {
    return <p className="text-sm text-destructive py-8 text-center">Failed to load report</p>
  }

  if (!data) return null

  const { rows, totals } = data

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Revenue" value={formatCurrency(totals.totalRevenue)} />
        <SummaryCard label="Commission" value={formatCurrency(totals.totalCommission)} />
        <SummaryCard label="Net Revenue" value={formatCurrency(totals.netRevenue)} />
        <SummaryCard label="Orders" value={totals.orderCount.toString()} />
      </div>

      {/* By source + by payment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground font-medium">By Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 text-sm">
              {Object.entries(totals.bySource).map(([src, v]) => (
                <div key={src} className="flex justify-between">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_SOURCE_COLORS[src as OrderSource]}`}>
                    {ORDER_SOURCE_LABELS[src as OrderSource]}
                  </span>
                  <span>{v.count} orders — {formatCurrency(v.revenue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground font-medium">By Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 text-sm">
              {Object.entries(totals.byPayment).map(([pm, v]) => (
                <div key={pm} className="flex justify-between">
                  <span className="capitalize">{PAYMENT_METHOD_LABELS[pm as PaymentMethod] ?? pm}</span>
                  <span>{v.count} orders — {formatCurrency(v.revenue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <ExportButtons onCSV={handleExportCSV} onPrint={handlePrint} />

      {/* Orders table */}
      <div className="rounded-lg border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No orders for this date
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-muted-foreground text-xs">
                    {format(new Date(r.created_at), 'HH:mm')}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_SOURCE_COLORS[r.source]}`}>
                      {ORDER_SOURCE_LABELS[r.source]}
                    </span>
                  </TableCell>
                  <TableCell>{r.customer_name ?? '—'}</TableCell>
                  <TableCell className="text-right">{r.item_count}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(r.total_amount)}</TableCell>
                  <TableCell className="capitalize">
                    {r.payment_method ? PAYMENT_METHOD_LABELS[r.payment_method] : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ORDER_STATUS_VARIANT[r.status as OrderStatus]}>
                      {ORDER_STATUS_LABELS[r.status as OrderStatus]}
                    </Badge>
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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-xs text-muted-foreground font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}
