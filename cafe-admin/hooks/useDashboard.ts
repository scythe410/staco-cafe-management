import { useQuery } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase'
import { startOfDay, subDays, format } from 'date-fns'
import {
  ORDER_STATUS,
  PENDING_STATUSES,
  ORDER_SOURCE_LABELS,
  type OrderSource,
} from '@/constants/orders'

const supabase = createBrowserClient()

// ─── Helpers ──────────────────────────────────────────────────────
function todayISO() {
  return startOfDay(new Date()).toISOString()
}

// ─── 1. Today's total sales ──────────────────────────────────────
export function useTodaySales() {
  return useQuery({
    queryKey: ['dashboard', 'todaySales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', ORDER_STATUS.COMPLETED)
        .gte('created_at', todayISO())

      if (error) throw error

      const total = (data ?? []).reduce(
        (sum, row) => sum + (row.total_amount ?? 0),
        0,
      )
      return total
    },
  })
}

// ─── 2. Today's order counts by status ───────────────────────────
export interface OrderCounts {
  total: number
  completed: number
  pending: number
  cancelled: number
}

export function useTodayOrderCounts() {
  return useQuery({
    queryKey: ['dashboard', 'orderCounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('status')
        .gte('created_at', todayISO())

      if (error) throw error

      const rows = data ?? []
      const counts: OrderCounts = {
        total: rows.length,
        completed: rows.filter((r) => r.status === ORDER_STATUS.COMPLETED).length,
        pending: rows.filter((r) =>
          PENDING_STATUSES.includes(r.status as typeof PENDING_STATUSES[number]),
        ).length,
        cancelled: rows.filter(
          (r) =>
            r.status === ORDER_STATUS.CANCELLED ||
            r.status === ORDER_STATUS.REFUNDED,
        ).length,
      }
      return counts
    },
  })
}

// ─── 3. Today's profit estimate ──────────────────────────────────
export interface ProfitEstimate {
  income: number
  expenses: number
  net: number
}

export function useTodayProfitEstimate() {
  return useQuery({
    queryKey: ['dashboard', 'profitEstimate'],
    queryFn: async () => {
      const today = todayISO()
      const todayDate = format(new Date(), 'yyyy-MM-dd')

      // Income: sum of completed order totals today
      const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', ORDER_STATUS.COMPLETED)
        .gte('created_at', today)

      if (ordersErr) throw ordersErr

      const income = (orders ?? []).reduce(
        (sum, r) => sum + (r.total_amount ?? 0),
        0,
      )

      // Expenses: sum of expenses recorded today
      const { data: expenses, error: expErr } = await supabase
        .from('expenses')
        .select('amount')
        .eq('date', todayDate)

      if (expErr) throw expErr

      const totalExpenses = (expenses ?? []).reduce(
        (sum, r) => sum + (r.amount ?? 0),
        0,
      )

      return {
        income,
        expenses: totalExpenses,
        net: income - totalExpenses,
      } satisfies ProfitEstimate
    },
  })
}

// ─── 4. Low stock items ──────────────────────────────────────────
export interface LowStockItem {
  id: string
  name: string
  quantity: number
  min_stock_level: number
  unit: string
}

export function useLowStockItems() {
  return useQuery({
    queryKey: ['dashboard', 'lowStock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('low_stock_ingredients')
        .select('id, name, quantity, min_stock_level, unit')
        .order('shortfall', { ascending: false })

      if (error) throw error
      return (data ?? []) as LowStockItem[]
    },
  })
}

// ─── 5. Today's orders grouped by source ─────────────────────────
export interface SourceData {
  name: string
  value: number
  color: string
}

const SOURCE_COLORS: Record<string, string> = {
  dine_in: '#18181b',
  takeaway: '#71717a',
  pickmefood: '#a1a1aa',
  ubereats: '#d4d4d8',
  other: '#e4e4e7',
}

export function useOrdersBySource() {
  return useQuery({
    queryKey: ['dashboard', 'ordersBySource'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('source')
        .gte('created_at', todayISO())

      if (error) throw error

      const counts: Record<string, number> = {}
      for (const row of data ?? []) {
        counts[row.source] = (counts[row.source] ?? 0) + 1
      }

      const result: SourceData[] = Object.entries(counts).map(
        ([source, count]) => ({
          name: ORDER_SOURCE_LABELS[source as OrderSource] ?? source,
          value: count,
          color: SOURCE_COLORS[source] ?? '#e4e4e7',
        }),
      )

      return result
    },
  })
}

// ─── 6. Revenue trend — last 7 days ─────────────────────────────
export interface RevenueDayData {
  day: string
  revenue: number
}

export function useRevenueTrend() {
  return useQuery({
    queryKey: ['dashboard', 'revenueTrend'],
    queryFn: async () => {
      const now = new Date()
      const sevenDaysAgo = startOfDay(subDays(now, 6))

      const { data, error } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('status', ORDER_STATUS.COMPLETED)
        .gte('created_at', sevenDaysAgo.toISOString())

      if (error) throw error

      // Bucket by day
      const buckets: Record<string, number> = {}
      for (let i = 0; i < 7; i++) {
        const d = subDays(now, 6 - i)
        buckets[format(d, 'yyyy-MM-dd')] = 0
      }

      for (const row of data ?? []) {
        const dayKey = format(new Date(row.created_at), 'yyyy-MM-dd')
        if (dayKey in buckets) {
          buckets[dayKey] += row.total_amount ?? 0
        }
      }

      const result: RevenueDayData[] = Object.entries(buckets).map(
        ([dateStr, revenue]) => ({
          day: format(new Date(dateStr), 'EEE'),
          revenue,
        }),
      )

      return result
    },
  })
}
