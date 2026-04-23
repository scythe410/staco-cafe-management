'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpsertSalary, type SalaryWithEmployee } from '@/hooks/useEmployees'
import { formatCurrency } from '@/lib/utils'
import { validatePositiveNumber } from '@/lib/validation'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface SalaryDialogProps {
  salary: SalaryWithEmployee | null
  month: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SalaryDialog({ salary, month, open, onOpenChange }: SalaryDialogProps) {
  const upsertSalary = useUpsertSalary()

  const [overtime, setOvertime] = useState('')
  const [advances, setAdvances] = useState('')
  const [deductions, setDeductions] = useState('')

  useEffect(() => {
    if (salary) {
      setOvertime((salary.overtime / 100).toString())
      setAdvances((salary.advances / 100).toString())
      setDeductions((salary.deductions / 100).toString())
    } else {
      setOvertime('0')
      setAdvances('0')
      setDeductions('0')
    }
  }, [salary, open])

  const baseSalaryCents = salary?.base_salary ?? 0
  const overtimeCents = Math.round(parseFloat(overtime || '0') * 100)
  const advancesCents = Math.round(parseFloat(advances || '0') * 100)
  const deductionsCents = Math.round(parseFloat(deductions || '0') * 100)

  const netSalary = useMemo(
    () => baseSalaryCents + overtimeCents - deductionsCents - advancesCents,
    [baseSalaryCents, overtimeCents, advancesCents, deductionsCents],
  )

  const maxMonth = format(new Date(), 'yyyy-MM')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!salary) return

    // Fix 6 — future month validation
    const selectedMonth = new Date(month + '-01')
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)
    if (selectedMonth > currentMonth) {
      toast.error('Cannot create salary records for future months')
      return
    }

    // Fix 5 — negative value validation
    const otErr = validatePositiveNumber(overtime || '0', 'Overtime', { allowZero: true })
    if (otErr) { toast.error(otErr); return }
    const advErr = validatePositiveNumber(advances || '0', 'Advances', { allowZero: true })
    if (advErr) { toast.error(advErr); return }
    const dedErr = validatePositiveNumber(deductions || '0', 'Deductions', { allowZero: true })
    if (dedErr) { toast.error(dedErr); return }

    upsertSalary.mutate(
      {
        id: salary.id,
        employee_id: salary.employee_id,
        month,
        base_salary: baseSalaryCents,
        overtime: overtimeCents,
        advances: advancesCents,
        deductions: deductionsCents,
        net_salary: netSalary,
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    )
  }

  if (!salary) return null

  const employeeName = salary.employees?.full_name ?? 'Employee'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Salary — {employeeName}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Base salary: {formatCurrency(baseSalaryCents)}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Overtime (LKR)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={overtime}
              onChange={(e) => setOvertime(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label>Advances (LKR)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={advances}
              onChange={(e) => setAdvances(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label>Deductions (LKR)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={deductions}
              onChange={(e) => setDeductions(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Net Salary</span>
              <span className="font-semibold">{formatCurrency(netSalary)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Base + Overtime - Deductions - Advances
            </p>
          </div>

          <Button type="submit" className="w-full h-11" disabled={upsertSalary.isPending}>
            {upsertSalary.isPending ? 'Saving...' : 'Save'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
