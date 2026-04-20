import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase'
import type { Employee, Salary } from '@/lib/types'

const supabase = createBrowserClient()

// ─── Employees list ─────────────────────────────────────────────
export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('full_name')

      if (error) throw error
      return (data ?? []) as Employee[]
    },
  })
}

// ─── Create employee ────────────────────────────────────────────
export interface CreateEmployeeInput {
  full_name: string
  role: string
  contact: string | null
  joining_date: string | null
  salary_type: 'monthly' | 'daily' | 'hourly'
  base_salary: number // cents
  is_active: boolean
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateEmployeeInput) => {
      const { data, error } = await supabase
        .from('employees')
        .insert(input)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

// ─── Update employee ────────────────────────────────────────────
export interface UpdateEmployeeInput extends Partial<CreateEmployeeInput> {
  id: string
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateEmployeeInput) => {
      const { data, error } = await supabase
        .from('employees')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}

// ─── Salaries for a given month ─────────────────────────────────
export type SalaryWithEmployee = Salary & { employees: { full_name: string } | null }

export function useSalaries(month: string) {
  return useQuery({
    queryKey: ['salaries', month],
    queryFn: async () => {
      // month comes as 'yyyy-MM' from the date picker; DB stores as date 'yyyy-MM-01'
      const monthDate = month.length === 7 ? `${month}-01` : month
      const { data, error } = await supabase
        .from('salaries')
        .select('*, employees(full_name)')
        .eq('month', monthDate)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as SalaryWithEmployee[]
    },
  })
}

// ─── Create / update salary record ──────────────────────────────
export interface UpsertSalaryInput {
  id?: string
  employee_id: string
  month: string
  base_salary: number   // cents
  overtime: number      // cents
  advances: number      // cents
  deductions: number    // cents
  net_salary: number    // cents
}

export function useUpsertSalary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpsertSalaryInput) => {
      const monthDate = input.month.length === 7 ? `${input.month}-01` : input.month
      if (input.id) {
        // Update existing
        const { id, ...rest } = input
        const { data, error } = await supabase
          .from('salaries')
          .update({ ...rest, month: monthDate })
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        // Insert new
        const { id: _, ...rest } = input
        const { data, error } = await supabase
          .from('salaries')
          .insert({ ...rest, month: monthDate })
          .select()
          .single()

        if (error) throw error
        return data
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['salaries', variables.month] })
    },
  })
}

// ─── Record payment (mark salary as paid) ───────────────────────
export function useRecordPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, month }: { id: string; month: string }) => {
      const { data, error } = await supabase
        .from('salaries')
        .update({ paid_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { data, month }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['salaries', result.month] })
    },
  })
}
