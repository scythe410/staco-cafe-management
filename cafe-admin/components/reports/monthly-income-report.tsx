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
import { useMonthlyIncomeReport } from '@/hooks/useReports'
import { formatCurrency, downloadCSV, printReport } from '@/lib/utils'
import { ExportButtons } from './export-buttons'
import { format } from 'date-fns'

interface MonthlyIncomeReportProps {
  month: string
}

export function MonthlyIncomeReport({ month }: MonthlyIncomeReportProps) {
  const { data, isLoading, isError } = useMonthlyIncomeReport(month)

  const monthLabel = month ? format(new Date(month + '-01'), 'MMMM yyyy') : ''

  function handleExportCSV() {
    if (!data) return
    const headers = ['Category', 'Type', 'Amount (LKR)']
    const rows: string[][] = []

    for (const src of data.revenueBySource) {
      rows.push([src.label, 'Revenue', (src.revenue / 100).toFixed(2)])
      if (src.commission > 0) {
        rows.push([`${src.label} Commission`, 'Commission', (src.commission / 100).toFixed(2)])
      }
    }
    for (const exp of data.expensesByCategory) {
      rows.push([exp.label, 'Expense', (exp.amount / 100).toFixed(2)])
    }
    rows.push(['Total Revenue', 'Total', (data.totalRevenue / 100).toFixed(2)])
    rows.push(['Total Expenses', 'Total', (data.totalExpenses / 100).toFixed(2)])
    rows.push(['Net Profit', 'Total', (data.netProfit / 100).toFixed(2)])

    downloadCSV(headers, rows, `monthly-income-${month}.csv`)
  }

  function handlePrint() {
    if (!data) return

    const revenueRows = data.revenueBySource.map((s) => `
      <tr><td>${s.label}</td><td class="num">${formatCurrency(s.revenue)}</td>
      <td class="num">${formatCurrency(s.commission)}</td><td class="num">${formatCurrency(s.net)}</td></tr>
    `).join('')

    const expenseRows = data.expensesByCategory.map((e) => `
      <tr><td>${e.label}</td><td class="num">${formatCurrency(e.amount)}</td></tr>
    `).join('')

    printReport(`Monthly Income — ${monthLabel}`, `
      <h1>Monthly Income Report</h1>
      <h2>${monthLabel}</h2>
      <div class="summary">
        <p><strong>Total Revenue:</strong> ${formatCurrency(data.totalRevenue)}</p>
        <p><strong>Total Expenses:</strong> ${formatCurrency(data.totalExpenses)}</p>
        <p><strong>Net Profit:</strong> ${formatCurrency(data.netProfit)}</p>
      </div>
      <h3 style="margin-top:24px;font-size:14px;">Revenue by Source</h3>
      <table><thead><tr><th>Source</th><th class="num">Revenue</th><th class="num">Commission</th><th class="num">Net</th></tr></thead>
      <tbody>${revenueRows}</tbody></table>
      <h3 style="font-size:14px;">Expenses by Category</h3>
      <table><thead><tr><th>Category</th><th class="num">Amount</th></tr></thead>
      <tbody>${expenseRows}</tbody></table>
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
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total Revenue" value={formatCurrency(data.totalRevenue)} className="text-emerald-600" />
        <KpiCard label="Total Expenses" value={formatCurrency(data.totalExpenses)} className="text-destructive" />
        <KpiCard label="Net Profit" value={formatCurrency(data.netProfit)} className={data.netProfit >= 0 ? 'text-emerald-600' : 'text-destructive'} />
      </div>

      <ExportButtons onCSV={handleExportCSV} onPrint={handlePrint} />

      {/* Revenue by source */}
      <div className="rounded-lg border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Commission</TableHead>
              <TableHead className="text-right">Net</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.revenueBySource.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No revenue data</TableCell>
              </TableRow>
            ) : (
              data.revenueBySource.map((s) => (
                <TableRow key={s.source}>
                  <TableCell className="font-medium">{s.label}</TableCell>
                  <TableCell className="text-right">{formatCurrency(s.revenue)}</TableCell>
                  <TableCell className="text-right text-destructive">{formatCurrency(s.commission)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(s.net)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Expenses by category */}
      <div className="rounded-lg border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Expense Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.expensesByCategory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground py-8">No expenses</TableCell>
              </TableRow>
            ) : (
              data.expensesByCategory.map((e) => (
                <TableRow key={e.category}>
                  <TableCell className="font-medium">{e.label}</TableCell>
                  <TableCell className="text-right">{formatCurrency(e.amount)}</TableCell>
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
