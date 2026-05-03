import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase'
import { ensureFreshSession } from '@/lib/auth'
import { broadcastInvalidate } from '@/hooks/useCrossTabSync'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  startOfTodaySL,
  startOfTomorrowSL,
  startOfDaysAgoSL,
  startOfMonthSL,
  startOfPreviousMonthSL,
  startOfDateSL,
  toSLDateString,
} from '@/lib/utils'
import type { Expense } from '@/lib/types'
import { ORDER_STATUS } from '@/constants/orders'
import type { ExpenseCategory } from '@/constants/expenses'

const supabase = createBrowserClient()

// ─── Date range presets ─────────────────────────────────────────
export type DatePreset = 'today' | 'this_week' | 'this_month' | 'custom'

export interface DateRange {
  from: string // ISO
  to: string   // ISO
}

export function getPresetRange(preset: DatePreset): DateRange {
  switch (preset) {
    case 'today':
      return { from: startOfTodaySL(), to: startOfTomorrowSL() }
    case 'this_week':
      return { from: startOfDaysAgoSL(6), to: startOfTomorrowSL() }
    case 'this_month':
      return { from: startOfMonthSL(), to: startOfTomorrowSL() }
    case 'custom':
      return { from: startOfMonthSL(), to: startOfTomorrowSL() }
  }
}

// ─── Overview: income, expenses, profit, order count ────────────
export interface FinanceSummary {
  totalIncome: number   // cents
  totalExpenses: number // cents
  netProfit: number     // cents
  totalOrders: number
}

export function useFinanceSummary(range: DateRange) {
  return useQuery({
    queryKey: ['finance', 'summary', range],
    queryFn: async () => {
      // Aggregate query: do NOT filter is_archived — financial totals must
      // include archived rows so historical figures stay correct.
      // total_amount is the stored final value (subtotal − discount + service_charge + tax).
      const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', ORDER_STATUS.COMPLETED)
        .gte('created_at', range.from)
        .lt('created_at', range.to)

      if (ordersErr) throw ordersErr

      const totalIncome = (orders ?? []).reduce(
        (sum, o) => sum + o.total_amount, 0,
      )
      const totalOrders = orders?.length ?? 0

      // Total expenses
      const fromDate = toSLDateString(range.from)
      const toDate = toSLDateString(range.to)
      const { data: expenses, error: expErr } = await supabase
        .from('expenses')
        .select('amount')
        .gte('date', fromDate)
        .lte('date', toDate)

      if (expErr) throw expErr

      const totalExpenses = (expenses ?? []).reduce((sum, e) => sum + e.amount, 0)

      return {
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
        totalOrders,
      } as FinanceSummary
    },
  })
}

// ─── Revenue by day (bar chart) ─────────────────────────────────
export interface RevenueByDay {
  day: string
  revenue: number
}

export function useRevenueByDay(range: DateRange) {
  return useQuery({
    queryKey: ['finance', 'revenueByDay', range],
    queryFn: async () => {
      // Aggregate query: archived orders intentionally included.
      // total_amount is the stored final value (subtotal − discount + service_charge + tax).
      const { data, error } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('status', ORDER_STATUS.COMPLETED)
        .gte('created_at', range.from)
        .lt('created_at', range.to)

      if (error) throw error

      const buckets = new Map<string, number>()
      for (const o of data ?? []) {
        const day = format(new Date(o.created_at), 'dd MMM')
        buckets.set(day, (buckets.get(day) ?? 0) + o.total_amount)
      }

      return Array.from(buckets.entries()).map(([day, revenue]) => ({
        day,
        revenue,
      })) as RevenueByDay[]
    },
  })
}

// ─── Payment method split (pie chart) ───────────────────────────
export interface PaymentSplit {
  name: string
  value: number
  color: string
}

const PAYMENT_COLORS: Record<string, string> = {
  cash: '#8B4513',
  card: '#D4882A',
  online: '#C4622D',
  other: '#A08070',
}

export function usePaymentMethodSplit(range: DateRange) {
  return useQuery({
    queryKey: ['finance', 'paymentSplit', range],
    queryFn: async () => {
      // Aggregate query: archived orders intentionally included.
      const { data, error } = await supabase
        .from('orders')
        .select('payment_method, total_amount')
        .eq('status', ORDER_STATUS.COMPLETED)
        .gte('created_at', range.from)
        .lt('created_at', range.to)

      if (error) throw error

      const buckets = new Map<string, number>()
      for (const o of data ?? []) {
        const method = o.payment_method ?? 'other'
        buckets.set(method, (buckets.get(method) ?? 0) + o.total_amount)
      }

      return Array.from(buckets.entries()).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: PAYMENT_COLORS[name] ?? '#6b7280',
      })) as PaymentSplit[]
    },
  })
}

// ─── Month-over-month comparison ────────────────────────────────
export interface MonthComparison {
  currentIncome: number
  previousIncome: number
  currentExpenses: number
  previousExpenses: number
  incomeGrowth: number | null  // percentage
  expenseGrowth: number | null
}

// Aggregate query: archived orders/expenses intentionally included.
export function useMonthComparison() {
  return useQuery({
    queryKey: ['finance', 'monthComparison'],
    queryFn: async () => {
      const curStart = startOfMonthSL()
      const curEnd = startOfTomorrowSL()
      const prevStart = startOfPreviousMonthSL()
      const prevEnd = curStart // previous month ends where current starts

      // total_amount is the stored final value (subtotal − discount + service_charge + tax).
      // Current month orders
      const { data: curOrders, error: e1 } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', ORDER_STATUS.COMPLETED)
        .gte('created_at', curStart)
        .lt('created_at', curEnd)
      if (e1) throw e1

      // Previous month orders
      const { data: prevOrders, error: e2 } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', ORDER_STATUS.COMPLETED)
        .gte('created_at', prevStart)
        .lt('created_at', prevEnd)
      if (e2) throw e2

      // Current month expenses
      const curStartDate = toSLDateString(curStart)
      const curEndDate = toSLDateString(new Date().toISOString())
      const { data: curExp, error: e3 } = await supabase
        .from('expenses')
        .select('amount')
        .gte('date', curStartDate)
        .lte('date', curEndDate)
      if (e3) throw e3

      // Previous month expenses
      const prevStartDate = toSLDateString(prevStart)
      // Last day of prev month = day before current month start
      const prevEndMs = new Date(curStart).getTime() - 1
      const prevEndDate = toSLDateString(new Date(prevEndMs).toISOString())
      const { data: prevExp, error: e4 } = await supabase
        .from('expenses')
        .select('amount')
        .gte('date', prevStartDate)
        .lte('date', prevEndDate)
      if (e4) throw e4

      const currentIncome = (curOrders ?? []).reduce((s, o) => s + o.total_amount, 0)
      const previousIncome = (prevOrders ?? []).reduce((s, o) => s + o.total_amount, 0)
      const currentExpenses = (curExp ?? []).reduce((s, e) => s + e.amount, 0)
      const previousExpenses = (prevExp ?? []).reduce((s, e) => s + e.amount, 0)

      const incomeGrowth = previousIncome > 0
        ? ((currentIncome - previousIncome) / previousIncome) * 100
        : null
      const expenseGrowth = previousExpenses > 0
        ? ((currentExpenses - previousExpenses) / previousExpenses) * 100
        : null

      return {
        currentIncome,
        previousIncome,
        currentExpenses,
        previousExpenses,
        incomeGrowth,
        expenseGrowth,
      } as MonthComparison
    },
  })
}

// ─── Expenses list (filterable) ─────────────────────────────────
export interface ExpenseFilters {
  category?: ExpenseCategory | 'all'
  dateFrom?: string
  dateTo?: string
  archived?: boolean // false (default) = active list, true = archived viewer
}

export function useExpenses(filters: ExpenseFilters = {}) {
  return useQuery({
    queryKey: ['finance', 'expenses', filters],
    queryFn: async () => {
      // Display query: hide archived rows by default. Aggregates above
      // (useFinanceSummary, useRevenueByDay, useExpenseBreakdown, etc.)
      // intentionally read all rows so historical totals stay correct.
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('is_archived', filters.archived === true)
        .order('date', { ascending: false })

      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category)
      }
      if (filters.dateFrom) {
        query = query.gte('date', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('date', filters.dateTo)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Expense[]
    },
  })
}

// ─── Expense breakdown by category (donut chart) ────────────────
export interface ExpenseBreakdown {
  category: string
  amount: number
  color: string
}

export function useExpenseBreakdown(range: DateRange) {
  return useQuery({
    queryKey: ['finance', 'expenseBreakdown', range],
    queryFn: async () => {
      // Aggregate query: archived expenses intentionally included.
      const bkFromDate = toSLDateString(range.from)
      const bkToDate = toSLDateString(range.to)
      const { data, error } = await supabase
        .from('expenses')
        .select('category, amount')
        .gte('date', bkFromDate)
        .lte('date', bkToDate)

      if (error) throw error

      const { EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_COLORS } = await import('@/constants/expenses')

      const buckets = new Map<string, number>()
      for (const e of data ?? []) {
        buckets.set(e.category, (buckets.get(e.category) ?? 0) + e.amount)
      }

      return Array.from(buckets.entries()).map(([cat, amount]) => ({
        category: EXPENSE_CATEGORY_LABELS[cat as ExpenseCategory] ?? cat,
        amount,
        color: EXPENSE_CATEGORY_COLORS[cat as ExpenseCategory] ?? '#6b7280',
      })) as ExpenseBreakdown[]
    },
  })
}

// ─── Create expense ─────────────────────────────────────────────
export interface CreateExpenseInput {
  category: ExpenseCategory
  amount: number // cents
  description: string | null
  date: string
  recorded_by: string
}

export function useCreateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      const ok = await ensureFreshSession()
      if (!ok) throw new Error('Your session has expired. Please sign in again.')

      const { data, error } = await supabase
        .from('expenses')
        .insert(input)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] })
      broadcastInvalidate(['finance'])
      toast.success('Expense added')
    },
    onError: (error) => {
      console.error('[useCreateExpense]', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to add expense. Please try again.'
      )
    },
  })
}

// ─── Platform earnings ──────────────────────────────────────────
export interface PlatformEarning {
  source: string
  label: string
  grossSales: number   // cents
  commission: number   // cents
  netReceived: number  // cents
  orderCount: number
}

export function usePlatformEarnings(range: DateRange) {
  return useQuery({
    queryKey: ['finance', 'platformEarnings', range],
    queryFn: async () => {
      // Aggregate query: archived orders intentionally included.
      const { data, error } = await supabase
        .from('orders')
        .select('source, total_amount, commission')
        .eq('status', ORDER_STATUS.COMPLETED)
        .in('source', ['pickmefood', 'ubereats'])
        .gte('created_at', range.from)
        .lt('created_at', range.to)

      if (error) throw error

      const { ORDER_SOURCE_LABELS } = await import('@/constants/orders')
      type SourceKey = keyof typeof ORDER_SOURCE_LABELS

      const buckets = new Map<string, { gross: number; commission: number; count: number }>()
      for (const o of data ?? []) {
        const prev = buckets.get(o.source) ?? { gross: 0, commission: 0, count: 0 }
        prev.gross += o.total_amount
        prev.commission += o.commission
        prev.count += 1
        buckets.set(o.source, prev)
      }

      return Array.from(buckets.entries()).map(([source, v]) => ({
        source,
        label: ORDER_SOURCE_LABELS[source as SourceKey] ?? source,
        grossSales: v.gross,
        commission: v.commission,
        netReceived: v.gross - v.commission,
        orderCount: v.count,
      })) as PlatformEarning[]
    },
  })
}
