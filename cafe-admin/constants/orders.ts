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

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new_order: 'New',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

/** Badge variant per status — matches DESIGN.md */
export const ORDER_STATUS_VARIANT: Record<OrderStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  new_order: 'secondary',
  accepted: 'secondary',
  preparing: 'secondary',
  ready: 'outline',
  completed: 'default',
  cancelled: 'destructive',
  refunded: 'destructive',
}

/** The next valid status for each workflow step */
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  new_order: ORDER_STATUS.ACCEPTED,
  accepted: ORDER_STATUS.PREPARING,
  preparing: ORDER_STATUS.READY,
  ready: ORDER_STATUS.COMPLETED,
}

export const NEXT_STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  new_order: 'Accept',
  accepted: 'Mark Preparing',
  preparing: 'Mark Ready',
  ready: 'Complete',
}

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

/** Tailwind classes for source badges */
export const ORDER_SOURCE_COLORS: Record<OrderSource, string> = {
  dine_in: 'bg-[#2C1810] text-[#F5ECD7]',
  takeaway: 'bg-[#8B4513] text-[#F5ECD7]',
  pickmefood: 'bg-[#C4622D] text-[#F5ECD7]',
  ubereats: 'bg-[#D4882A] text-[#2C1810]',
  other: 'bg-[#EDE0CF] text-[#2C1810]',
}

/** Sources that charge a commission */
export const COMMISSION_SOURCES: OrderSource[] = [
  ORDER_SOURCE.PICKMEFOOD,
  ORDER_SOURCE.UBEREATS,
]

export const PAYMENT_METHOD = {
  CASH: 'cash',
  CARD: 'card',
  ONLINE: 'online',
  OTHER: 'other',
} as const

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  online: 'Online',
  other: 'Other',
}
