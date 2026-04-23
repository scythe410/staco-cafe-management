'use client'

import { useState } from 'react'
import { Pencil, Check, Printer, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useSalaries,
  useRecordPayment,
  type SalaryWithEmployee,
} from '@/hooks/useEmployees'
import { formatCurrency, formatDate } from '@/lib/utils'
import { SalaryDialog } from './salary-dialog'
import { ROLES, type Role } from '@/constants/roles'
import { format } from 'date-fns'

interface SalaryTableProps {
  userRole: Role
}

export function SalaryTable({ userRole }: SalaryTableProps) {
  const [month, setMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const { data: salaries, isLoading, isError } = useSalaries(month)
  const recordPayment = useRecordPayment()
  const [editSalary, setEditSalary] = useState<SalaryWithEmployee | null>(null)

  const isOwner = userRole === ROLES.OWNER

  function handlePrint(salary: SalaryWithEmployee) {
    const employeeName = salary.employees?.full_name ?? 'Employee'
    const w = window.open('', '_blank', 'width=600,height=700')
    if (!w) return
    w.document.write(`
      <!DOCTYPE html>
      <html><head><title>Salary Slip — ${employeeName}</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 40px; max-width: 500px; margin: 0 auto; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        h2 { font-size: 14px; color: #666; font-weight: normal; margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 24px; }
        td { padding: 8px 0; font-size: 14px; }
        td:last-child { text-align: right; }
        .divider { border-top: 1px solid #ddd; }
        .total td { font-weight: bold; font-size: 16px; border-top: 2px solid #333; padding-top: 12px; }
        .footer { margin-top: 40px; font-size: 12px; color: #999; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <h1>Stacko Cafe — Salary Slip</h1>
      <h2>${format(new Date(month + '-01'), 'MMMM yyyy')}</h2>
      <p><strong>${employeeName}</strong></p>
      <table>
        <tr><td>Base Salary</td><td>${formatCurrency(salary.base_salary)}</td></tr>
        <tr><td>Overtime</td><td>+ ${formatCurrency(salary.overtime)}</td></tr>
        <tr><td>Deductions</td><td>- ${formatCurrency(salary.deductions)}</td></tr>
        <tr><td>Advances</td><td>- ${formatCurrency(salary.advances)}</td></tr>
        <tr class="total"><td>Net Salary</td><td>${formatCurrency(salary.net_salary)}</td></tr>
      </table>
      <p style="margin-top: 24px; font-size: 14px;">
        Status: ${salary.paid_at ? 'Paid on ' + formatDate(salary.paid_at) : 'Unpaid'}
      </p>
      <p class="footer">Generated on ${formatDate(new Date().toISOString())}</p>
      </body></html>
    `)
    w.document.close()
    w.print()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/employees"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Employees
          </Link>
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-[180px] h-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive py-8 text-center">Failed to load salary data</p>
      ) : (
        <div className="rounded-lg border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                {isOwner && <TableHead className="text-right">Base</TableHead>}
                {isOwner && <TableHead className="text-right">Overtime</TableHead>}
                {isOwner && <TableHead className="text-right">Advances</TableHead>}
                {isOwner && <TableHead className="text-right">Deductions</TableHead>}
                {isOwner && <TableHead className="text-right">Net Salary</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead className="w-[130px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!salaries || salaries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isOwner ? 8 : 3}
                    className="text-center text-muted-foreground py-8"
                  >
                    No salary records for {format(new Date(month + '-01'), 'MMMM yyyy')}
                  </TableCell>
                </TableRow>
              ) : (
                salaries.map((sal) => (
                  <TableRow key={sal.id}>
                    <TableCell className="font-medium">
                      {sal.employees?.full_name ?? '—'}
                    </TableCell>
                    {isOwner && (
                      <TableCell className="text-right">{formatCurrency(sal.base_salary)}</TableCell>
                    )}
                    {isOwner && (
                      <TableCell className="text-right">{formatCurrency(sal.overtime)}</TableCell>
                    )}
                    {isOwner && (
                      <TableCell className="text-right">{formatCurrency(sal.advances)}</TableCell>
                    )}
                    {isOwner && (
                      <TableCell className="text-right">{formatCurrency(sal.deductions)}</TableCell>
                    )}
                    {isOwner && (
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(sal.net_salary)}
                      </TableCell>
                    )}
                    <TableCell>
                      {sal.paid_at ? (
                        <Badge variant="default" className="text-xs">Paid</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">Unpaid</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {isOwner && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => setEditSalary(sal)}
                            title="Edit salary"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {isOwner && !sal.paid_at && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-emerald-600"
                            onClick={() => recordPayment.mutate({ id: sal.id, month })}
                            disabled={recordPayment.isPending}
                            title="Record payment"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {isOwner && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => handlePrint(sal)}
                            title="Print slip"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <SalaryDialog
        salary={editSalary}
        month={month}
        open={!!editSalary}
        onOpenChange={(open) => { if (!open) setEditSalary(null) }}
      />
    </div>
  )
}
