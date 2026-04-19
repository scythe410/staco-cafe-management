'use client'

import { useRealtimeOrders } from '@/hooks/useOrders'

/** Drop this into any page that should react to live order changes. */
export function OrderRealtimeListener() {
  useRealtimeOrders()
  return null
}
