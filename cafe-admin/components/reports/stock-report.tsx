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
import { useStockReport } from '@/hooks/useReports'
import { formatCurrency, downloadCSV, printReport } from '@/lib/utils'
import { ExportButtons } from './export-buttons'

export function StockReport() {
  const { data: rows, isLoading, isError } = useStockReport()

  function handleExportCSV() {
    if (!rows) return
    const headers = ['Name', 'Category', 'Qty', 'Unit', 'Min Level', 'Cost Price (LKR)', 'Low Stock']
    const csvRows = rows.map((r) => [
      r.name,
      r.category,
      r.quantity.toString(),
      r.unit,
      r.min_stock_level.toString(),
      (r.cost_price / 100).toFixed(2),
      r.isLowStock ? 'YES' : '',
    ])
    downloadCSV(headers, csvRows, `stock-report.csv`)
  }

  function handlePrint() {
    if (!rows) return
    const lowCount = rows.filter((r) => r.isLowStock).length
    const totalValue = rows.reduce((s, r) => s + r.cost_price * r.quantity, 0)

    const tableRows = rows.map((r) => `
      <tr${r.isLowStock ? ' class="low-stock"' : ''}>
        <td>${r.name}</td>
        <td>${r.category}</td>
        <td class="num">${r.quantity} ${r.unit}</td>
        <td class="num">${r.min_stock_level} ${r.unit}</td>
        <td class="num">${formatCurrency(r.cost_price)}</td>
        <td>${r.isLowStock ? 'LOW' : '—'}</td>
      </tr>
    `).join('')

    printReport('Stock Report', `
      <h1>Stock Report</h1>
      <h2>${rows.length} items — ${lowCount} low stock</h2>
      <div class="summary">
        <p><strong>Total Items:</strong> ${rows.length}</p>
        <p><strong>Low Stock Items:</strong> ${lowCount}</p>
        <p><strong>Total Stock Value:</strong> ${formatCurrency(totalValue)}</p>
      </div>
      <table>
        <thead><tr><th>Name</th><th>Category</th><th class="num">Qty</th><th class="num">Min Level</th><th class="num">Cost Price</th><th>Status</th></tr></thead>
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

  if (isError) return <p className="text-sm text-destructive py-8 text-center">Failed to load report</p>
  if (!rows) return null

  const lowCount = rows.filter((r) => r.isLowStock).length

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {rows.length} ingredients — <span className="text-destructive font-medium">{lowCount} low stock</span>
      </p>

      <ExportButtons onCSV={handleExportCSV} onPrint={handlePrint} />

      <div className="rounded-lg border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Min Level</TableHead>
              <TableHead className="text-right">Cost Price</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">{r.category}</Badge>
                </TableCell>
                <TableCell className={`text-right font-medium ${r.isLowStock ? 'text-destructive' : 'text-emerald-600'}`}>
                  {r.quantity} {r.unit}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {r.min_stock_level} {r.unit}
                </TableCell>
                <TableCell className="text-right">{formatCurrency(r.cost_price)}</TableCell>
                <TableCell>
                  {r.isLowStock ? (
                    <Badge variant="destructive" className="text-xs">Low Stock</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">OK</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
