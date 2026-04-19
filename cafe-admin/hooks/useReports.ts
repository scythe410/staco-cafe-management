import { useQuery } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase'
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns'
import { ORDER_STATUS } from '@/constants/orders'
import type { OrderSource } from '@/constants/orders'
import type { PaymentMethod } from '@/constants/orders'
import type { ExpenseCategory } from '@/constants/expenses'

const supabase = createBrowserClient()

// ─── Daily Sales Report ─────────────────────────────────────────
export interface DailySalesRow {
  id: string
  source: OrderSource
  status: string
  customer_name: string | null
  total_amount: number
  commission: number
  payment_method: PaymentMethod | null
  created_at: string
  item_count: number
}

export interface DailySalesTotals {
  totalRevenue: number
  totalCommission: number
  netRevenue: number
  orderCount: number
  bySource: Record<string, { count: number; revenue: number }>
  byPayment: Record<string, { count: number; revenue: number }>
}

export function useDailySalesReport(date: string) {
  return useQuery({
    queryKey: ['reports', 'dailySales', date],
    enabled: !!date,
    queryFn: async () => {
      const dayStart = startOfDay(new Date(date)).toISOString()
      const dayEnd = endOfDay(new Date(date)).toISOString()

      const { data, error } = await supabase
        .from('orders')
        .select('id, source, status, customer_name, total_amount, commission, payment_method, created_at, order_items(count)')
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd)
        .order('created_at', { ascending: false })

      if (error) throw error

      const rows: DailySalesRow[] = (data ?? []).map((o) => ({
        id: o.id,
        source: o.source as OrderSource,
        status: o.status,
        customer_name: o.customer_name,
        total_amount: o.total_amount,
        commission: o.commission,
        payment_method: o.payment_method as PaymentMethod | null,
        created_at: o.created_at,
        item_count: (o.order_items as { count: number }[])?.[0]?.count ?? 0,
      }))

      // Calculate totals from completed orders
      const completed = rows.filter((r) => r.status === ORDER_STATUS.COMPLETED)
      const totalRevenue = completed.reduce((s, r) => s + r.total_amount, 0)
      const totalCommission = completed.reduce((s, r) => s + r.commission, 0)

      const bySource: Record<string, { count: number; revenue: number }> = {}
      const byPayment: Record<string, { count: number; revenue: number }> = {}

      for (const r of completed) {
        const src = bySource[r.source] ?? { count: 0, revenue: 0 }
        src.count++
        src.revenue += r.total_amount
        bySource[r.source] = src

        const pm = r.payment_method ?? 'other'
        const pay = byPayment[pm] ?? { count: 0, revenue: 0 }
        pay.count++
        pay.revenue += r.total_amount
        byPayment[pm] = pay
      }

      const totals: DailySalesTotals = {
        totalRevenue,
        totalCommission,
        netRevenue: totalRevenue - totalCommission,
        orderCount: completed.length,
        bySource,
        byPayment,
      }

      return { rows, totals }
    },
  })
}

// ─── Monthly Income Report ──────────────────────────────────────
export interface MonthlyIncomeData {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  expensesByCategory: { category: string; label: string; amount: number }[]
  revenueBySource: { source: string; label: string; revenue: number; commission: number; net: number }[]
}

export function useMonthlyIncomeReport(month: string) {
  return useQuery({
    queryKey: ['reports', 'monthlyIncome', month],
    enabled: !!month,
    queryFn: async () => {
      const monthStart = startOfMonth(new Date(month + '-01')).toISOString()
      const monthEnd = endOfMonth(new Date(month + '-01')).toISOString()

      // Revenue from completed orders
      const { data: orders, error: e1 } = await supabase
        .from('orders')
        .select('source, total_amount, discount, tax, commission')
        .eq('status', ORDER_STATUS.COMPLETED)
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd)
      if (e1) throw e1

      const totalRevenue = (orders ?? []).reduce(
        (s, o) => s + o.total_amount - o.discount + o.tax, 0,
      )

      // Revenue by source
      const srcMap = new Map<string, { revenue: number; commission: number }>()
      for (const o of orders ?? []) {
        const prev = srcMap.get(o.source) ?? { revenue: 0, commission: 0 }
        prev.revenue += o.total_amount - o.discount + o.tax
        prev.commission += o.commission
        srcMap.set(o.source, prev)
      }

      const { ORDER_SOURCE_LABELS } = await import('@/constants/orders')
      type SrcKey = keyof typeof ORDER_SOURCE_LABELS
      const revenueBySource = Array.from(srcMap.entries()).map(([source, v]) => ({
        source,
        label: ORDER_SOURCE_LABELS[source as SrcKey] ?? source,
        revenue: v.revenue,
        commission: v.commission,
        net: v.revenue - v.commission,
      }))

      // Expenses
      const { data: expenses, error: e2 } = await supabase
        .from('expenses')
        .select('category, amount')
        .gte('date', monthStart.slice(0, 10))
        .lte('date', monthEnd.slice(0, 10))
      if (e2) throw e2

      const catMap = new Map<string, number>()
      let totalExpenses = 0
      for (const e of expenses ?? []) {
        catMap.set(e.category, (catMap.get(e.category) ?? 0) + e.amount)
        totalExpenses += e.amount
      }

      const { EXPENSE_CATEGORY_LABELS } = await import('@/constants/expenses')
      type CatKey = keyof typeof EXPENSE_CATEGORY_LABELS
      const expensesByCategory = Array.from(catMap.entries()).map(([category, amount]) => ({
        category,
        label: EXPENSE_CATEGORY_LABELS[category as CatKey] ?? category,
        amount,
      }))

      return {
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        expensesByCategory,
        revenueBySource,
      } as MonthlyIncomeData
    },
  })
}

// ─── Stock Report ───────────────────────────────────────────────
export interface StockReportRow {
  id: string
  name: string
  category: string
  unit: string
  quantity: number
  min_stock_level: number
  cost_price: number
  isLowStock: boolean
}

export function useStockReport() {
  return useQuery({
    queryKey: ['reports', 'stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingredients')
        .select('id, name, category, unit, quantity, min_stock_level, cost_price')
        .order('category')
        .order('name')

      if (error) throw error

      return (data ?? []).map((i) => ({
        ...i,
        isLowStock: i.quantity < i.min_stock_level,
      })) as StockReportRow[]
    },
  })
}

// ─── Salary Report ──────────────────────────────────────────────
export interface SalaryReportRow {
  id: string
  employee_name: string
  base_salary: number
  overtime: number
  advances: number
  deductions: number
  net_salary: number
  paid_at: string | null
}

export function useSalaryReport(month: string) {
  return useQuery({
    queryKey: ['reports', 'salary', month],
    enabled: !!month,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('salaries')
        .select('id, base_salary, overtime, advances, deductions, net_salary, paid_at, employees(full_name)')
        .eq('month', month)
        .order('created_at')

      if (error) throw error

      return (data ?? []).map((s) => ({
        id: s.id,
        employee_name: (s.employees as unknown as { full_name: string } | null)?.full_name ?? 'Unknown',
        base_salary: s.base_salary,
        overtime: s.overtime,
        advances: s.advances,
        deductions: s.deductions,
        net_salary: s.net_salary,
        paid_at: s.paid_at,
      })) as SalaryReportRow[]
    },
  })
}
