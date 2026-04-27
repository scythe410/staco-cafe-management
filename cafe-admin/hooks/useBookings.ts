import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase'
import { ensureFreshSession } from '@/lib/auth'
import { broadcastInvalidate } from '@/hooks/useCrossTabSync'
import { escapeLikePattern, toSLDateString, startOfMonthSL, startOfTodaySL } from '@/lib/utils'
import { toast } from 'sonner'
import {
  BOOKING_STATUS,
  type BookingStatus,
  type BookingSource,
  type BookingPaymentMethod,
  type BookingPaymentType,
} from '@/constants/bookings'
import type { Booking, BookingItem, BookingPayment } from '@/lib/types'

const supabase = createBrowserClient()

// ─── Types ──────────────────────────────────────────────────────
export interface BookingFilters {
  status?: BookingStatus | 'all'
  source?: BookingSource | 'all'
  view?: 'upcoming' | 'today' | 'past' | 'all' | 'date'
  date?: string             // yyyy-MM-dd (for view='date')
  dateFrom?: string         // yyyy-MM-dd
  dateTo?: string           // yyyy-MM-dd
  search?: string           // name, phone, or code
}

export type BookingRow = Booking & {
  booking_items: { count: number }[]
}

export type BookingDetailItem = BookingItem & {
  menu_items: { name: string; category: string } | null
}

export type BookingDetail = Booking & {
  booking_items: BookingDetailItem[]
  booking_payments: BookingPayment[]
}

const TODAY_VIEW_FINAL: BookingStatus[] = []

// ─── List ───────────────────────────────────────────────────────
export function useBookings(filters: BookingFilters = {}) {
  return useQuery({
    queryKey: ['bookings', 'list', filters],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select('*, booking_items(count)')

      const today = toSLDateString(startOfTodaySL())

      if (filters.view === 'upcoming' || !filters.view) {
        query = query
          .gte('booking_date', today)
          .not('status', 'in', `(${BOOKING_STATUS.CANCELLED},${BOOKING_STATUS.COMPLETED},${BOOKING_STATUS.NO_SHOW})`)
          .order('booking_date', { ascending: true })
          .order('start_time', { ascending: true })
      } else if (filters.view === 'today') {
        query = query
          .eq('booking_date', today)
          .order('start_time', { ascending: true })
      } else if (filters.view === 'past') {
        query = query
          .or(`booking_date.lt.${today},status.in.(${BOOKING_STATUS.COMPLETED},${BOOKING_STATUS.CANCELLED},${BOOKING_STATUS.NO_SHOW})`)
          .order('booking_date', { ascending: false })
      } else if (filters.view === 'date' && filters.date) {
        query = query
          .eq('booking_date', filters.date)
          .order('start_time', { ascending: true })
      } else {
        query = query
          .order('booking_date', { ascending: false })
          .order('start_time', { ascending: true })
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      if (filters.source && filters.source !== 'all') {
        query = query.eq('source', filters.source)
      }
      if (filters.dateFrom) query = query.gte('booking_date', filters.dateFrom)
      if (filters.dateTo)   query = query.lte('booking_date', filters.dateTo)

      if (filters.search?.trim()) {
        const term = filters.search.trim()
        const escaped = escapeLikePattern(term)
        // Phone search: strip non-digits for matching
        const phoneNormalized = term.replace(/[\s-]/g, '')
        const phoneEscaped = escapeLikePattern(phoneNormalized)
        query = query.or(
          `booking_code.ilike.%${escaped}%,customer_name.ilike.%${escaped}%,customer_phone.ilike.%${phoneEscaped}%`,
        )
      }

      const { data, error } = await query
      if (error) throw error
      // Suppress unused-import warning
      void TODAY_VIEW_FINAL
      return (data ?? []) as BookingRow[]
    },
  })
}

// ─── Detail ─────────────────────────────────────────────────────
export function useBooking(id: string | null) {
  return useQuery({
    queryKey: ['bookings', 'detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          booking_items(*, menu_items(name, category)),
          booking_payments(*)
        `)
        .eq('id', id!)
        .order('created_at', { foreignTable: 'booking_payments', ascending: true })
        .single()

      if (error) throw error
      return data as BookingDetail
    },
  })
}

// ─── Stats / sidebar widgets ────────────────────────────────────
export function useUpcomingBookings(limit: number = 5) {
  return useQuery({
    queryKey: ['bookings', 'upcoming', limit],
    queryFn: async () => {
      const today = toSLDateString(startOfTodaySL())
      const { data, error } = await supabase
        .from('bookings')
        .select('id, booking_code, customer_name, party_size, booking_date, start_time, end_time, status, balance_due, total_amount')
        .gte('booking_date', today)
        .not('status', 'in', `(${BOOKING_STATUS.CANCELLED},${BOOKING_STATUS.COMPLETED},${BOOKING_STATUS.NO_SHOW})`)
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(limit)
      if (error) throw error
      return data ?? []
    },
  })
}

export function useTodaysBookings() {
  return useQuery({
    queryKey: ['bookings', 'today'],
    queryFn: async () => {
      const today = toSLDateString(startOfTodaySL())
      const { data, error } = await supabase
        .from('bookings')
        .select('id, booking_code, customer_name, party_size, start_time, end_time, status')
        .eq('booking_date', today)
        .order('start_time', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })
}

export interface BookingStats {
  todayCount: number
  weekCount: number
  monthCount: number
  pendingBalanceDue: number  // cents
}

export function useBookingStats() {
  return useQuery({
    queryKey: ['bookings', 'stats'],
    queryFn: async () => {
      const today = toSLDateString(startOfTodaySL())
      const weekEnd = new Date(startOfTodaySL())
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 7)
      const weekEndStr = toSLDateString(weekEnd.toISOString())

      const monthStart = toSLDateString(startOfMonthSL())
      const monthEnd = new Date(startOfMonthSL())
      monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1)
      const monthEndStr = toSLDateString(monthEnd.toISOString())

      const [todayRes, weekRes, monthRes, balanceRes] = await Promise.all([
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('booking_date', today),
        supabase.from('bookings').select('id', { count: 'exact', head: true })
          .gte('booking_date', today).lt('booking_date', weekEndStr)
          .not('status', 'in', `(${BOOKING_STATUS.CANCELLED},${BOOKING_STATUS.NO_SHOW})`),
        supabase.from('bookings').select('id', { count: 'exact', head: true })
          .gte('booking_date', monthStart).lt('booking_date', monthEndStr)
          .not('status', 'in', `(${BOOKING_STATUS.CANCELLED},${BOOKING_STATUS.NO_SHOW})`),
        supabase.from('bookings').select('balance_due')
          .gt('balance_due', 0)
          .eq('status', BOOKING_STATUS.CONFIRMED),
      ])

      if (todayRes.error)   throw todayRes.error
      if (weekRes.error)    throw weekRes.error
      if (monthRes.error)   throw monthRes.error
      if (balanceRes.error) throw balanceRes.error

      const pendingBalanceDue = (balanceRes.data ?? []).reduce(
        (sum, r) => sum + (r.balance_due ?? 0),
        0,
      )

      return {
        todayCount: todayRes.count ?? 0,
        weekCount: weekRes.count ?? 0,
        monthCount: monthRes.count ?? 0,
        pendingBalanceDue,
      } as BookingStats
    },
  })
}

// ─── Calendar view: month grid ──────────────────────────────────
export function useBookingsByMonth(year: number, month: number) {
  // month is 0-indexed
  return useQuery({
    queryKey: ['bookings', 'month', year, month],
    queryFn: async () => {
      const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
      const next = new Date(Date.UTC(year, month + 1, 1))
      const monthEnd = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-01`

      const { data, error } = await supabase
        .from('bookings')
        .select('id, booking_code, booking_date, start_time, status, customer_name, party_size')
        .gte('booking_date', monthStart)
        .lt('booking_date', monthEnd)
        .order('booking_date')
        .order('start_time')

      if (error) throw error
      return data ?? []
    },
  })
}

// ─── Conflict check (soft warning) ──────────────────────────────
export interface BookingConflict {
  id: string
  booking_code: string
  customer_name: string
  party_size: number
  start_time: string
  end_time: string
}

export function useCheckBookingConflicts(
  date: string | null,
  startTime: string | null,
  endTime: string | null,
  excludeId?: string | null,
) {
  return useQuery({
    queryKey: ['bookings', 'conflicts', date, startTime, endTime, excludeId],
    enabled: !!(date && startTime && endTime && endTime > startTime),
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select('id, booking_code, customer_name, party_size, start_time, end_time')
        .eq('booking_date', date!)
        .not('status', 'in', `(${BOOKING_STATUS.CANCELLED},${BOOKING_STATUS.NO_SHOW})`)
        // overlap test: existing.start < new.end AND existing.end > new.start
        .lt('start_time', endTime!)
        .gt('end_time', startTime!)

      if (excludeId) query = query.neq('id', excludeId)

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as BookingConflict[]
    },
  })
}

// ─── Mutations ──────────────────────────────────────────────────
export interface CreateBookingInput {
  customer_name: string
  customer_phone: string
  customer_email: string | null
  party_size: number
  occasion: string | null
  booking_date: string         // yyyy-MM-dd
  start_time: string           // HH:mm
  end_time: string             // HH:mm
  table_or_area: string | null
  special_notes: string | null
  booking_fee: number          // cents
  discount: number             // cents
  service_charge: number       // cents
  tax: number                  // cents
  deposit_paid: number         // cents
  deposit_method: BookingPaymentMethod | null
  deposit_reference: string | null
  source: BookingSource
  items: { menu_item_id: string; quantity: number; unit_price: number; notes: string | null }[]
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['bookings'] })
  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  broadcastInvalidate(['bookings'])
  broadcastInvalidate(['dashboard'])
}

export function useCreateBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      const ok = await ensureFreshSession()
      if (!ok) throw new Error('Your session has expired. Please sign in again.')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.rpc('create_booking_with_items', {
        p_customer_name: input.customer_name,
        p_customer_phone: input.customer_phone,
        p_customer_email: input.customer_email,
        p_party_size: input.party_size,
        p_occasion: input.occasion,
        p_booking_date: input.booking_date,
        p_start_time: input.start_time,
        p_end_time: input.end_time,
        p_table_or_area: input.table_or_area,
        p_special_notes: input.special_notes,
        p_booking_fee: input.booking_fee,
        p_discount: input.discount,
        p_service_charge: input.service_charge,
        p_tax: input.tax,
        p_deposit_paid: input.deposit_paid,
        p_deposit_method: input.deposit_method,
        p_deposit_reference: input.deposit_reference,
        p_source: input.source,
        p_created_by: user.id,
        p_items: input.items,
      })

      if (error) throw error
      return data as string  // booking id
    },
    onSuccess: () => {
      invalidateAll(queryClient)
      toast.success('Booking created')
    },
    onError: (error) => {
      console.error('[useCreateBooking]', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create booking.')
    },
  })
}

export interface UpdateBookingInput {
  id: string
  customer_name?: string
  customer_phone?: string
  customer_email?: string | null
  party_size?: number
  occasion?: string | null
  booking_date?: string
  start_time?: string
  end_time?: string
  table_or_area?: string | null
  special_notes?: string | null
  booking_fee?: number
  discount?: number
  service_charge?: number
  tax?: number
  source?: BookingSource
  items?: { menu_item_id: string; quantity: number; unit_price: number; notes: string | null }[]
}

export function useUpdateBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, items, ...patch }: UpdateBookingInput) => {
      const ok = await ensureFreshSession()
      if (!ok) throw new Error('Your session has expired. Please sign in again.')

      if (items) {
        const { error: itemsErr } = await supabase.rpc('replace_booking_items', {
          p_booking_id: id,
          p_items: items,
        })
        if (itemsErr) throw itemsErr
      }

      if (Object.keys(patch).length > 0) {
        const { error } = await supabase
          .from('bookings')
          .update(patch)
          .eq('id', id)
        if (error) throw error
      }

      return id
    },
    onSuccess: () => {
      invalidateAll(queryClient)
      toast.success('Booking updated')
    },
    onError: (error) => {
      console.error('[useUpdateBooking]', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update booking.')
    },
  })
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      const ok = await ensureFreshSession()
      if (!ok) throw new Error('Your session has expired. Please sign in again.')

      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id)
      if (error) throw error
      return { id, status }
    },
    onSuccess: () => {
      invalidateAll(queryClient)
      toast.success('Booking status updated')
    },
    onError: (error) => {
      console.error('[useUpdateBookingStatus]', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update status.')
    },
  })
}

export interface CancelBookingInput {
  id: string
  reason: string
  refundDeposit: boolean
  depositAmount: number      // cents (snapshot at cancel time)
  depositMethod: string | null
}

export function useCancelBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CancelBookingInput) => {
      const ok = await ensureFreshSession()
      if (!ok) throw new Error('Your session has expired. Please sign in again.')

      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('bookings')
        .update({
          status: BOOKING_STATUS.CANCELLED,
          cancelled_at: new Date().toISOString(),
          cancellation_reason: input.reason,
        })
        .eq('id', input.id)
      if (error) throw error

      if (input.refundDeposit && input.depositAmount > 0) {
        const { error: payErr } = await supabase
          .from('booking_payments')
          .insert({
            booking_id: input.id,
            amount: input.depositAmount,
            method: input.depositMethod ?? 'cash',
            type: 'refund',
            recorded_by: user?.id ?? null,
          })
        if (payErr) throw payErr
      }

      return input.id
    },
    onSuccess: () => {
      invalidateAll(queryClient)
      toast.success('Booking cancelled')
    },
    onError: (error) => {
      console.error('[useCancelBooking]', error)
      toast.error(error instanceof Error ? error.message : 'Failed to cancel booking.')
    },
  })
}

export interface RecordPaymentInput {
  bookingId: string
  amount: number      // cents
  method: BookingPaymentMethod
  type: BookingPaymentType
  reference: string | null
}

export function useRecordBookingPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: RecordPaymentInput) => {
      const ok = await ensureFreshSession()
      if (!ok) throw new Error('Your session has expired. Please sign in again.')

      const { data: { user } } = await supabase.auth.getUser()

      // Insert payment row
      const { error: payErr } = await supabase
        .from('booking_payments')
        .insert({
          booking_id: input.bookingId,
          amount: input.amount,
          method: input.method,
          type: input.type,
          reference: input.reference,
          recorded_by: user?.id ?? null,
        })
      if (payErr) throw payErr

      // Recompute deposit_paid as sum of (deposit + balance) - refund
      const { data: payments, error: sumErr } = await supabase
        .from('booking_payments')
        .select('amount, type')
        .eq('booking_id', input.bookingId)
      if (sumErr) throw sumErr

      const totalPaid = (payments ?? []).reduce((sum, p) => {
        if (p.type === 'refund') return sum - p.amount
        return sum + p.amount
      }, 0)

      const { error: updErr } = await supabase
        .from('bookings')
        .update({ deposit_paid: Math.max(0, totalPaid) })
        .eq('id', input.bookingId)
      if (updErr) throw updErr

      return input.bookingId
    },
    onSuccess: () => {
      invalidateAll(queryClient)
      toast.success('Payment recorded')
    },
    onError: (error) => {
      console.error('[useRecordBookingPayment]', error)
      toast.error(error instanceof Error ? error.message : 'Failed to record payment.')
    },
  })
}

// ─── Bookings report ────────────────────────────────────────────
export interface BookingsReportSummary {
  totalBookings: number
  totalRevenue: number          // cents (completed only)
  averagePartySize: number
  topOccasion: string
}

export interface BookingsReportRow {
  id: string
  booking_code: string
  customer_name: string
  customer_phone: string
  booking_date: string
  start_time: string
  end_time: string
  party_size: number
  occasion: string | null
  source: string
  status: string
  total_amount: number
  deposit_paid: number
  balance_due: number
}

export function useBookingsReport(from: string, to: string) {
  return useQuery({
    queryKey: ['reports', 'bookings', from, to],
    enabled: !!from && !!to,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, booking_code, customer_name, customer_phone, booking_date, start_time, end_time, party_size, occasion, source, status, total_amount, deposit_paid, balance_due')
        .gte('booking_date', from)
        .lte('booking_date', to)
        .order('booking_date', { ascending: true })
      if (error) throw error

      const rows = (data ?? []) as BookingsReportRow[]
      const completed = rows.filter((r) => r.status === BOOKING_STATUS.COMPLETED)

      const occasionCounts = new Map<string, number>()
      for (const r of rows) {
        const key = r.occasion?.trim() || '—'
        occasionCounts.set(key, (occasionCounts.get(key) ?? 0) + 1)
      }
      let topOccasion = '—'
      let topCount = 0
      for (const [occ, count] of occasionCounts) {
        if (count > topCount) {
          topOccasion = occ
          topCount = count
        }
      }

      const summary: BookingsReportSummary = {
        totalBookings: rows.length,
        totalRevenue: completed.reduce((s, r) => s + r.total_amount, 0),
        averagePartySize: rows.length === 0
          ? 0
          : Math.round(rows.reduce((s, r) => s + r.party_size, 0) / rows.length),
        topOccasion,
      }

      return { rows, summary }
    },
  })
}

// ─── Finance helper: completed booking revenue ─────────────────
export function useBookingRevenue(fromIso: string, toIso: string) {
  return useQuery({
    queryKey: ['bookings', 'revenue', fromIso, toIso],
    enabled: !!fromIso && !!toIso,
    queryFn: async () => {
      const fromDate = toSLDateString(fromIso)
      const toDate = toSLDateString(toIso)
      const { data, error } = await supabase
        .from('bookings')
        .select('total_amount')
        .eq('status', BOOKING_STATUS.COMPLETED)
        .gte('booking_date', fromDate)
        .lte('booking_date', toDate)
      if (error) throw error
      return (data ?? []).reduce((sum, b) => sum + (b.total_amount ?? 0), 0)
    },
  })
}
