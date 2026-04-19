import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase'
import type { Order, OrderItem, MenuItem } from '@/lib/types'
import type { OrderStatus, OrderSource, PaymentMethod } from '@/constants/orders'
import { ORDER_STATUS } from '@/constants/orders'

const supabase = createBrowserClient()

// ─── Realtime subscription ──────────────────────────────────────
/**
 * Subscribes to INSERT and UPDATE events on the orders table.
 * Invalidates all order and dashboard queries on any change.
 */
export function useRealtimeOrders() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['orders'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['orders'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}

// ─── Filters ────────────────────────────────────────────────────
export interface OrderFilters {
  source?: OrderSource | 'all'
  status?: OrderStatus | 'all'
  paymentMethod?: PaymentMethod | 'all'
  dateFrom?: string // ISO date
  dateTo?: string   // ISO date
  search?: string   // order ID or customer name
}

// ─── Orders list ────────────────────────────────────────────────
export type OrderRow = Order & { order_items: { count: number }[] }

export function useOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*, order_items(count)')
        .order('created_at', { ascending: false })

      if (filters.source && filters.source !== 'all') {
        query = query.eq('source', filters.source)
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      if (filters.paymentMethod && filters.paymentMethod !== 'all') {
        query = query.eq('payment_method', filters.paymentMethod)
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }
      if (filters.dateTo) {
        // Add a day to make the range inclusive
        const nextDay = new Date(filters.dateTo)
        nextDay.setDate(nextDay.getDate() + 1)
        query = query.lt('created_at', nextDay.toISOString())
      }
      if (filters.search?.trim()) {
        const term = filters.search.trim()
        query = query.or(`id.eq.${term},customer_name.ilike.%${term}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return (data ?? []) as OrderRow[]
    },
  })
}

// ─── Order detail (with line items + menu item names) ───────────
export type OrderDetailItem = OrderItem & { menu_items: { name: string; category: string } | null }
export type OrderDetail = Order & { order_items: OrderDetailItem[] }

export function useOrderDetail(id: string | null) {
  return useQuery({
    queryKey: ['orders', 'detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, menu_items(name, category))')
        .eq('id', id!)
        .single()

      if (error) throw error
      return data as OrderDetail
    },
  })
}

// ─── Update order status ────────────────────────────────────────
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const updates: Record<string, unknown> = { status }
      if (status === ORDER_STATUS.COMPLETED) {
        updates.completed_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// ─── Menu items (for add-order form) ────────────────────────────
export function useMenuItems() {
  return useQuery({
    queryKey: ['menuItems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('category')
        .order('name')

      if (error) throw error
      return (data ?? []) as MenuItem[]
    },
  })
}

// ─── Create order ───────────────────────────────────────────────
export interface CreateOrderInput {
  source: OrderSource
  customer_name: string | null
  payment_method: PaymentMethod
  commission: number // cents
  items: { menu_item_id: string; quantity: number; unit_price: number }[]
}

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const subtotal = input.items.reduce(
        (sum, item) => sum + item.unit_price * item.quantity,
        0,
      )

      // Insert order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          source: input.source,
          status: ORDER_STATUS.NEW_ORDER,
          customer_name: input.customer_name || null,
          total_amount: subtotal,
          discount: 0,
          tax: 0,
          commission: input.commission,
          payment_method: input.payment_method,
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Insert order items
      const orderItems = input.items.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      return order
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
