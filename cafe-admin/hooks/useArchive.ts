import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase'
import { ensureFreshSession } from '@/lib/auth'
import { broadcastInvalidate } from '@/hooks/useCrossTabSync'
import { toast } from 'sonner'

const supabase = createBrowserClient()

export type ArchivableTable =
  | 'orders'
  | 'expenses'
  | 'bookings'
  | 'stock_updates'
  | 'notifications'

const TABLE_INVALIDATIONS: Record<ArchivableTable, string[][]> = {
  orders:        [['orders'], ['dashboard'], ['finance'], ['reports']],
  expenses:      [['expenses'], ['finance'], ['reports'], ['dashboard']],
  bookings:      [['bookings'], ['dashboard'], ['finance'], ['reports']],
  stock_updates: [['inventory'], ['stockLog']],
  notifications: [['notifications']],
}

function invalidateFor(queryClient: ReturnType<typeof useQueryClient>, table: ArchivableTable) {
  for (const key of TABLE_INVALIDATIONS[table]) {
    queryClient.invalidateQueries({ queryKey: key })
    broadcastInvalidate(key)
  }
}

export function useArchiveRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ table, id }: { table: ArchivableTable; id: string }) => {
      const ok = await ensureFreshSession()
      if (!ok) throw new Error('Your session has expired. Please sign in again.')

      const { error } = await supabase.rpc('archive_record', {
        p_table: table,
        p_id: id,
      })
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      invalidateFor(queryClient, vars.table)
      toast.success('Record archived')
    },
    onError: (error) => {
      console.error('[useArchiveRecord]', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to archive record. Please try again.',
      )
    },
  })
}

export function useUnarchiveRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ table, id }: { table: ArchivableTable; id: string }) => {
      const ok = await ensureFreshSession()
      if (!ok) throw new Error('Your session has expired. Please sign in again.')

      const { error } = await supabase.rpc('unarchive_record', {
        p_table: table,
        p_id: id,
      })
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      invalidateFor(queryClient, vars.table)
      toast.success('Record restored')
    },
    onError: (error) => {
      console.error('[useUnarchiveRecord]', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to restore record. Please try again.',
      )
    },
  })
}

export interface ArchiveBulkResult {
  orders: number
  expenses: number
  bookings: number
  notifications: number
  cutoff: string
}

export function useArchiveOlderThan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (days: number): Promise<ArchiveBulkResult> => {
      const ok = await ensureFreshSession()
      if (!ok) throw new Error('Your session has expired. Please sign in again.')

      const { data, error } = await supabase.rpc('archive_records_older_than', {
        p_days: days,
      })
      if (error) throw error
      return data as ArchiveBulkResult
    },
    onSuccess: (data) => {
      const tables: ArchivableTable[] = ['orders', 'expenses', 'bookings', 'notifications']
      for (const t of tables) invalidateFor(queryClient, t)

      const total = data.orders + data.expenses + data.bookings + data.notifications
      if (total === 0) {
        toast.info('No records old enough to archive')
      } else {
        toast.success(
          `Archived ${total} record${total === 1 ? '' : 's'} ` +
          `(${data.orders} orders, ${data.expenses} expenses, ${data.bookings} bookings, ${data.notifications} notifications)`,
        )
      }
    },
    onError: (error) => {
      console.error('[useArchiveOlderThan]', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to archive records. Please try again.',
      )
    },
  })
}
