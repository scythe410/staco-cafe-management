'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useEmployees } from '@/hooks/useEmployees'
import { formatCurrency, formatDate } from '@/lib/utils'
import { EmployeeDialog } from './employee-dialog'
import type { Employee } from '@/lib/types'
import type { Role } from '@/constants/roles'
import { ROLES } from '@/constants/roles'

interface EmployeesTableProps {
  userRole: Role
}

export function EmployeesTable({ userRole }: EmployeesTableProps) {
  const { data: employees, isLoading, isError } = useEmployees()
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)

  const isOwner = userRole === ROLES.OWNER

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/employees/salary">
          <Button variant="outline" className="h-11">
            Salary Management
          </Button>
        </Link>
        <EmployeeDialog trigger />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive py-8 text-center">Failed to load employees</p>
      ) : (
        <div className="rounded-lg border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joining Date</TableHead>
                <TableHead>Salary Type</TableHead>
                {isOwner && <TableHead className="text-right">Base Salary</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!employees || employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isOwner ? 7 : 6} className="text-center text-muted-foreground py-8">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">{emp.full_name}</TableCell>
                    <TableCell>{emp.role}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {emp.joining_date ? formatDate(emp.joining_date) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {emp.salary_type}
                      </Badge>
                    </TableCell>
                    {isOwner && (
                      <TableCell className="text-right font-medium">
                        {formatCurrency(emp.base_salary)}
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant={emp.is_active ? 'default' : 'destructive'} className="text-xs">
                        {emp.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => setEditEmployee(emp)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <EmployeeDialog
        employee={editEmployee}
        open={!!editEmployee}
        onOpenChange={(open) => { if (!open) setEditEmployee(null) }}
      />
    </div>
  )
}
