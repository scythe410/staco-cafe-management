import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase'
import { ensureFreshSession } from '@/lib/auth'
import { broadcastInvalidate } from '@/hooks/useCrossTabSync'
import { toast } from 'sonner'
import { escapeLikePattern } from '@/lib/utils'
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
        if (term) {
          const escaped = escapeLikePattern(term)
          query = query.or(`id.ilike.%${escaped}%,customer_name.ilike.%${escaped}%`)
        }
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
      const ok = await ensureFreshSession()
      if (!ok) throw new Error('Your session has expired. Please sign in again.')

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
      broadcastInvalidate(['orders'])
      broadcastInvalidate(['dashboard'])
      toast.success('Order status updated')
    },
    onError: (error) => {
      console.error('[useUpdateOrderStatus]', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update order status. Please try again.'
      )
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
      const ok = await ensureFreshSession()
      if (!ok) throw new Error('Your session has expired. Please sign in again.')

      const subtotal = input.items.reduce(
        (sum, item) => sum + item.unit_price * item.quantity,
        0,
      )

      const { data, error } = await supabase.rpc('create_order_with_items', {
        p_source: input.source,
        p_customer_name: input.customer_name || null,
        p_payment_method: input.payment_method,
        p_commission: input.commission,
        p_discount: 0,
        p_tax: 0,
        p_total_amount: subtotal,
        p_created_by: null,
        p_items: input.items.map((item) => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      broadcastInvalidate(['orders'])
      broadcastInvalidate(['dashboard'])
      toast.success('Order created')
    },
    onError: (error) => {
      console.error('[useCreateOrder]', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to create order. Please try again.'
      )
    },
  })
}
