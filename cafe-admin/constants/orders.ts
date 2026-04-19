export const ORDER_STATUS = {
  NEW_ORDER: 'new_order',
  ACCEPTED: 'accepted',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

/** Statuses that mean the order is still in progress */
export const PENDING_STATUSES: OrderStatus[] = [
  ORDER_STATUS.NEW_ORDER,
  ORDER_STATUS.ACCEPTED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY,
]

export const ORDER_SOURCE = {
  DINE_IN: 'dine_in',
  TAKEAWAY: 'takeaway',
  PICKMEFOOD: 'pickmefood',
  UBEREATS: 'ubereats',
  OTHER: 'other',
} as const

export type OrderSource = (typeof ORDER_SOURCE)[keyof typeof ORDER_SOURCE]

export const ORDER_SOURCE_LABELS: Record<OrderSource, string> = {
  dine_in: 'Dine-in',
  takeaway: 'Takeaway',
  pickmefood: 'PickMe Food',
  ubereats: 'Uber Eats',
  other: 'Other',
}
