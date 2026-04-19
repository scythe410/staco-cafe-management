'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useCreateEmployee,
  useUpdateEmployee,
  type CreateEmployeeInput,
} from '@/hooks/useEmployees'
import type { Employee } from '@/lib/types'

const EMPLOYEE_ROLES = ['Manager', 'Chef', 'Barista', 'Waiter', 'Cashier', 'Kitchen Helper', 'Cleaner', 'Other'] as const
const SALARY_TYPES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'daily', label: 'Daily' },
  { value: 'hourly', label: 'Hourly' },
] as const

interface EmployeeDialogProps {
  employee?: Employee | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: boolean
}

export function EmployeeDialog({
  employee,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger = false,
}: EmployeeDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const onOpenChange = controlledOnOpenChange ?? setInternalOpen

  const isEdit = !!employee
  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee()
  const isPending = createEmployee.isPending || updateEmployee.isPending

  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<string>(EMPLOYEE_ROLES[0])
  const [contact, setContact] = useState('')
  const [joiningDate, setJoiningDate] = useState('')
  const [salaryType, setSalaryType] = useState<'monthly' | 'daily' | 'hourly'>('monthly')
  const [baseSalary, setBaseSalary] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (employee) {
      setFullName(employee.full_name)
      setRole(employee.role)
      setContact(employee.contact ?? '')
      setJoiningDate(employee.joining_date?.slice(0, 10) ?? '')
      setSalaryType(employee.salary_type)
      setBaseSalary((employee.base_salary / 100).toString())
      setIsActive(employee.is_active)
    } else {
      setFullName('')
      setRole(EMPLOYEE_ROLES[0])
      setContact('')
      setJoiningDate('')
      setSalaryType('monthly')
      setBaseSalary('')
      setIsActive(true)
    }
  }, [employee, open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const input: CreateEmployeeInput = {
      full_name: fullName.trim(),
      role,
      contact: contact.trim() || null,
      joining_date: joiningDate || null,
      salary_type: salaryType,
      base_salary: Math.round(parseFloat(baseSalary) * 100),
      is_active: isActive,
    }

    if (isEdit && employee) {
      updateEmployee.mutate(
        { id: employee.id, ...input },
        { onSuccess: () => onOpenChange(false) },
      )
    } else {
      createEmployee.mutate(input, {
        onSuccess: () => onOpenChange(false),
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          <Button className="h-11 gap-1.5">
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Contact</Label>
              <Input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Phone / email"
                className="h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Joining Date</Label>
              <Input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Salary Type</Label>
              <Select value={salaryType} onValueChange={(v) => setSalaryType(v as 'monthly' | 'daily' | 'hourly')}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SALARY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Base Salary (LKR)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                required
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                className="h-11"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={isActive ? 'active' : 'inactive'} onValueChange={(v) => setIsActive(v === 'active')}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full h-11" disabled={isPending}>
            {isPending ? 'Saving...' : isEdit ? 'Update Employee' : 'Add Employee'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
