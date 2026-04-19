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
import { useSalaryReport } from '@/hooks/useReports'
import { formatCurrency, formatDate, downloadCSV, printReport } from '@/lib/utils'
import { ExportButtons } from './export-buttons'
import { format } from 'date-fns'

interface SalaryReportProps {
  month: string
}

export function SalaryReport({ month }: SalaryReportProps) {
  const { data: rows, isLoading, isError } = useSalaryReport(month)

  const monthLabel = month ? format(new Date(month + '-01'), 'MMMM yyyy') : ''

  function handleExportCSV() {
    if (!rows) return
    const headers = ['Employee', 'Base Salary', 'Overtime', 'Advances', 'Deductions', 'Net Salary', 'Status', 'Paid Date']
    const csvRows = rows.map((r) => [
      r.employee_name,
      (r.base_salary / 100).toFixed(2),
      (r.overtime / 100).toFixed(2),
      (r.advances / 100).toFixed(2),
      (r.deductions / 100).toFixed(2),
      (r.net_salary / 100).toFixed(2),
      r.paid_at ? 'Paid' : 'Unpaid',
      r.paid_at ? formatDate(r.paid_at) : '',
    ])
    downloadCSV(headers, csvRows, `salary-report-${month}.csv`)
  }

  function handlePrint() {
    if (!rows) return
    const totalNet = rows.reduce((s, r) => s + r.net_salary, 0)
    const paidCount = rows.filter((r) => r.paid_at).length

    const tableRows = rows.map((r) => `
      <tr>
        <td>${r.employee_name}</td>
        <td class="num">${formatCurrency(r.base_salary)}</td>
        <td class="num">${formatCurrency(r.overtime)}</td>
        <td class="num">${formatCurrency(r.advances)}</td>
        <td class="num">${formatCurrency(r.deductions)}</td>
        <td class="num"><strong>${formatCurrency(r.net_salary)}</strong></td>
        <td>${r.paid_at ? 'Paid' : 'Unpaid'}</td>
      </tr>
    `).join('')

    printReport(`Salary Report — ${monthLabel}`, `
      <h1>Salary Report</h1>
      <h2>${monthLabel}</h2>
      <div class="summary">
        <p><strong>Total Net Salaries:</strong> ${formatCurrency(totalNet)}</p>
        <p><strong>Paid:</strong> ${paidCount} / ${rows.length}</p>
      </div>
      <table>
        <thead><tr><th>Employee</th><th class="num">Base</th><th class="num">Overtime</th><th class="num">Advances</th><th class="num">Deductions</th><th class="num">Net</th><th>Status</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    `)
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-muted" />
        ))}
      </div>
    )
  }

  if (isError) return <p className="text-sm text-destructive py-8 text-center">Failed to load report</p>
  if (!rows) return null

  const totalNet = rows.reduce((s, r) => s + r.net_salary, 0)

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {rows.length} employees — Total: <span className="font-medium text-foreground">{formatCurrency(totalNet)}</span>
      </p>

      <ExportButtons onCSV={handleExportCSV} onPrint={handlePrint} />

      <div className="rounded-lg border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead className="text-right">Base</TableHead>
              <TableHead className="text-right">Overtime</TableHead>
              <TableHead className="text-right">Advances</TableHead>
              <TableHead className="text-right">Deductions</TableHead>
              <TableHead className="text-right">Net Salary</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No salary records for {monthLabel}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.employee_name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.base_salary)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.overtime)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.advances)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.deductions)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(r.net_salary)}</TableCell>
                  <TableCell>
                    {r.paid_at ? (
                      <Badge variant="default" className="text-xs">Paid</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">Unpaid</Badge>
                    )}
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
