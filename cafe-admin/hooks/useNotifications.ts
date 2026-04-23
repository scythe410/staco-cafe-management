import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Notification } from '@/lib/types'

const supabase = createBrowserClient()

// ─── Notifications list (unread first, last 20) ─────────────────
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('is_read', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return (data ?? []) as Notification[]
    },
  })
}

// ─── Unread count ───────────────────────────────────────────────
export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false)

      if (error) throw error
      return count ?? 0
    },
  })
}

// ─── Mark single notification as read ───────────────────────────
export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error) => {
      console.error('[useMarkAsRead]', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to mark notification as read.'
      )
    },
  })
}

// ─── Mark all as read ───────────────────────────────────────────
export function useMarkAllRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error) => {
      console.error('[useMarkAllRead]', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to mark notifications as read.'
      )
    },
  })
}

// ─── Realtime subscription ──────────────────────────────────────
export function useRealtimeNotifications() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
