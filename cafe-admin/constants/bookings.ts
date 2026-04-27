export const BOOKING_STATUS = {
  TENTATIVE: 'tentative',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const

export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS]

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  tentative: 'Tentative',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
}

/** Tailwind classes for status badges — consistent with order palette. */
export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  tentative: 'bg-[#EDE0CF] text-[#2C1810]',
  confirmed: 'bg-[#8B4513] text-[#F5ECD7]',
  in_progress: 'bg-[#D4882A] text-[#2C1810]',
  completed: 'bg-transparent text-foreground border border-foreground/40',
  cancelled: 'bg-[#C4622D] text-[#F5ECD7]',
  no_show: 'bg-[#C4622D] text-[#F5ECD7]',
}

export const BOOKING_SOURCE = {
  WALK_IN: 'walk_in',
  PHONE: 'phone',
  WHATSAPP: 'whatsapp',
  EMAIL: 'email',
} as const

export type BookingSource = (typeof BOOKING_SOURCE)[keyof typeof BOOKING_SOURCE]

export const BOOKING_SOURCE_LABELS: Record<BookingSource, string> = {
  walk_in: 'Walk-in',
  phone: 'Phone',
  whatsapp: 'WhatsApp',
  email: 'Email',
}

export const BOOKING_PAYMENT_METHOD = {
  CASH: 'cash',
  CARD: 'card',
  ONLINE: 'online',
  TRANSFER: 'transfer',
} as const

export type BookingPaymentMethod = (typeof BOOKING_PAYMENT_METHOD)[keyof typeof BOOKING_PAYMENT_METHOD]

export const BOOKING_PAYMENT_METHOD_LABELS: Record<BookingPaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  online: 'Online',
  transfer: 'Bank Transfer',
}

export const BOOKING_PAYMENT_TYPE = {
  DEPOSIT: 'deposit',
  BALANCE: 'balance',
  REFUND: 'refund',
} as const

export type BookingPaymentType = (typeof BOOKING_PAYMENT_TYPE)[keyof typeof BOOKING_PAYMENT_TYPE]

export const BOOKING_PAYMENT_TYPE_LABELS: Record<BookingPaymentType, string> = {
  deposit: 'Deposit',
  balance: 'Balance',
  refund: 'Refund',
}

export const BOOKING_OCCASIONS = [
  'Birthday',
  'Anniversary',
  'Corporate',
  'Study Group',
  'Bridal Shower',
  'Baby Shower',
  'Other',
] as const

/** Sri Lanka phone format: 0XXXXXXXXX or +94XXXXXXXXX */
export const SL_PHONE_REGEX = /^(?:\+94\d{9}|0\d{9})$/

/** Standard email format for client-side validation. */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Max booking date offset (months) from today. */
export const BOOKING_MAX_MONTHS_AHEAD = 6
