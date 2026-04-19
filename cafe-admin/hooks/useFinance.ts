import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase'
import { startOfDay, startOfWeek, startOfMonth, subMonths, endOfMonth, format } from 'date-fns'
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
  const now = new Date()
  switch (preset) {
    case 'today':
      return { from: startOfDay(now).toISOString(), to: now.toISOString() }
    case 'this_week':
      return { from: startOfWeek(now, { weekStartsOn: 1 }).toISOString(), to: now.toISOString() }
    case 'this_month':
      return { from: startOfMonth(now).toISOString(), to: now.toISOString() }
    case 'custom':
      return { from: startOfMonth(now).toISOString(), to: now.toISOString() }
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
      // Total income from completed orders
      const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('total_amount, discount, tax')
        .eq('status', ORDER_STATUS.COMPLETED)
        .gte('created_at', range.from)
        .lte('created_at', range.to)

      if (ordersErr) throw ordersErr

      const totalIncome = (orders ?? []).reduce(
        (sum, o) => sum + o.total_amount - o.discount + o.tax, 0,
      )
      const totalOrders = orders?.length ?? 0

      // Total expenses
      const { data: expenses, error: expErr } = await supabase
        .from('expenses')
        .select('amount')
        .gte('date', range.from.slice(0, 10))
        .lte('date', range.to.slice(0, 10))

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
      const { data, error } = await supabase
        .from('orders')
        .select('total_amount, discount, tax, created_at')
        .eq('status', ORDER_STATUS.COMPLETED)
        .gte('created_at', range.from)
        .lte('created_at', range.to)

      if (error) throw error

      const buckets = new Map<string, number>()
      for (const o of data ?? []) {
        const day = format(new Date(o.created_at), 'dd MMM')
        const net = o.total_amount - o.discount + o.tax
        buckets.set(day, (buckets.get(day) ?? 0) + net)
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
  cash: '#3b82f6',
  card: '#8b5cf6',
  online: '#10b981',
  other: '#6b7280',
}

export function usePaymentMethodSplit(range: DateRange) {
  return useQuery({
    queryKey: ['finance', 'paymentSplit', range],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('payment_method, total_amount')
        .eq('status', ORDER_STATUS.COMPLETED)
        .gte('created_at', range.from)
        .lte('created_at', range.to)

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

export function useMonthComparison() {
  return useQuery({
    queryKey: ['finance', 'monthComparison'],
    queryFn: async () => {
      const now = new Date()
      const curStart = startOfMonth(now).toISOString()
      const curEnd = now.toISOString()
      const prevStart = startOfMonth(subMonths(now, 1)).toISOString()
      const prevEnd = endOfMonth(subMonths(now, 1)).toISOString()

      // Current month orders
      const { data: curOrders, error: e1 } = await supabase
        .from('orders')
        .select('total_amount, discount, tax')
        .eq('status', ORDER_STATUS.COMPLETED)
        .gte('created_at', curStart)
        .lte('created_at', curEnd)
      if (e1) throw e1

      // Previous month orders
      const { data: prevOrders, error: e2 } = await supabase
        .from('orders')
        .select('total_amount, discount, tax')
        .eq('status', ORDER_STATUS.COMPLETED)
        .gte('created_at', prevStart)
        .lte('created_at', prevEnd)
      if (e2) throw e2

      // Current month expenses
      const { data: curExp, error: e3 } = await supabase
        .from('expenses')
        .select('amount')
        .gte('date', curStart.slice(0, 10))
        .lte('date', curEnd.slice(0, 10))
      if (e3) throw e3

      // Previous month expenses
      const { data: prevExp, error: e4 } = await supabase
        .from('expenses')
        .select('amount')
        .gte('date', prevStart.slice(0, 10))
        .lte('date', prevEnd.slice(0, 10))
      if (e4) throw e4

      const currentIncome = (curOrders ?? []).reduce((s, o) => s + o.total_amount - o.discount + o.tax, 0)
      const previousIncome = (prevOrders ?? []).reduce((s, o) => s + o.total_amount - o.discount + o.tax, 0)
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
}

export function useExpenses(filters: ExpenseFilters = {}) {
  return useQuery({
    queryKey: ['finance', 'expenses', filters],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select('*')
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
      const { data, error } = await supabase
        .from('expenses')
        .select('category, amount')
        .gte('date', range.from.slice(0, 10))
        .lte('date', range.to.slice(0, 10))

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
      const { data, error } = await supabase
        .from('orders')
        .select('source, total_amount, commission')
        .eq('status', ORDER_STATUS.COMPLETED)
        .in('source', ['pickmefood', 'ubereats'])
        .gte('created_at', range.from)
        .lte('created_at', range.to)

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
