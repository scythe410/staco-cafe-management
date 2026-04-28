import { useQuery } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase'
import { format } from 'date-fns'
import {
  startOfTodaySL,
  startOfTomorrowSL,
  startOfDaysAgoSL,
  toSLDateString,
} from '@/lib/utils'
import {
  ORDER_STATUS,
  PENDING_STATUSES,
  ORDER_SOURCE_LABELS,
  type OrderSource,
} from '@/constants/orders'

const supabase = createBrowserClient()

// ─── 1. Today's total sales ──────────────────────────────────────
export function useTodaySales() {
  return useQuery({
    queryKey: ['dashboard', 'todaySales'],
    queryFn: async () => {
      // Aggregate query: archived orders intentionally included.
      const { data, error } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', ORDER_STATUS.COMPLETED)
        .gte('created_at', startOfTodaySL())
        .lt('created_at', startOfTomorrowSL())

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
        .gte('created_at', startOfTodaySL())
        .lt('created_at', startOfTomorrowSL())

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
      const todayStart = startOfTodaySL()
      const todayEnd = startOfTomorrowSL()
      const todayDate = toSLDateString(new Date().toISOString())

      // Income: sum of completed order totals today
      const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', ORDER_STATUS.COMPLETED)
        .gte('created_at', todayStart)
        .lt('created_at', todayEnd)

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
  dine_in: '#2C1810',
  takeaway: '#8B4513',
  pickmefood: '#C4622D',
  ubereats: '#D4882A',
  other: '#EDE0CF',
}

export function useOrdersBySource() {
  return useQuery({
    queryKey: ['dashboard', 'ordersBySource'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('source')
        .gte('created_at', startOfTodaySL())
        .lt('created_at', startOfTomorrowSL())

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
      const sevenDaysAgo = startOfDaysAgoSL(6)
      const tomorrow = startOfTomorrowSL()

      const { data, error } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('status', ORDER_STATUS.COMPLETED)
        .gte('created_at', sevenDaysAgo)
        .lt('created_at', tomorrow)

      if (error) throw error

      // Bucket by SL-local day
      const buckets: Record<string, number> = {}
      for (let i = 0; i < 7; i++) {
        const dayStart = new Date(startOfDaysAgoSL(6 - i))
        const key = toSLDateString(dayStart.toISOString())
        buckets[key] = 0
      }

      for (const row of data ?? []) {
        const dayKey = toSLDateString(row.created_at)
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
