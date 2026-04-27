import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase'
import { ensureFreshSession } from '@/lib/auth'
import { broadcastInvalidate } from '@/hooks/useCrossTabSync'
import { escapeLikePattern } from '@/lib/utils'
import { toast } from 'sonner'
import type { MenuItem } from '@/lib/types'

const supabase = createBrowserClient()

const MENU_KEY = ['menu'] as const

export type AvailabilityFilter = 'all' | 'available' | 'unavailable'

export interface MenuItemFilters {
  category?: string
  availability?: AvailabilityFilter
  search?: string
}

// ─── Menu items list (with filters) ─────────────────────────────
export function useMenuItems(filters: MenuItemFilters = {}) {
  return useQuery({
    queryKey: ['menu', 'list', filters],
    queryFn: async () => {
      let query = supabase
        .from('menu_items')
        .select('*')
        .order('category')
        .order('name')

      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category)
      }
      if (filters.availability === 'available') {
        query = query.eq('is_available', true)
      } else if (filters.availability === 'unavailable') {
        query = query.eq('is_available', false)
      }
      if (filters.search?.trim()) {
        const escaped = escapeLikePattern(filters.search.trim())
        query = query.ilike('name', `%${escaped}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return (data ?? []) as MenuItem[]
    },
  })
}

// ─── Single menu item ───────────────────────────────────────────
export function useMenuItem(id: string | null) {
  return useQuery({
    queryKey: ['menu', 'detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', id!)
        .single()

      if (error) throw error
      return data as MenuItem
    },
  })
}

// ─── Unavailable count (for nav badge) ──────────────────────────
export function useUnavailableMenuCount() {
  return useQuery({
    queryKey: ['menu', 'unavailableCount'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('menu_items')
        .select('id', { count: 'exact', head: true })
        .eq('is_available', false)

      if (error) throw error
      return count ?? 0
    },
  })
}

// ─── Usage count (order_items references) ───────────────────────
export function useMenuItemUsageCount(id: string | null) {
  return useQuery({
    queryKey: ['menu', 'usageCount', id],
    enabled: !!id,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('order_items')
        .select('id', { count: 'exact', head: true })
        .eq('menu_item_id', id!)

      if (error) throw error
      return count ?? 0
    },
  })
}

// ─── Create menu item ───────────────────────────────────────────
export interface CreateMenuItemInput {
  name: string
  category: string
  price: number // cents
  is_available: boolean
  notes: string | null
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateMenuItemInput) => {
      const ok = await ensureFreshSession()
      if (!ok) throw new Error('Your session has expired. Please sign in again.')

      const { data, error } = await supabase
        .from('menu_items')
        .insert(input)
        .select()
        .single()

      if (error) throw error
      return data as MenuItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEY })
      queryClient.invalidateQueries({ queryKey: ['menuItems'] })
      broadcastInvalidate(['menu'])
      broadcastInvalidate(['menuItems'])
      toast.success('Menu item added')
    },
    onError: (error) => {
      console.error('[useCreateMenuItem]', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to add menu item. Please try again.',
      )
    },
  })
}

// ─── Update menu item ───────────────────────────────────────────
export interface UpdateMenuItemInput extends Partial<CreateMenuItemInput> {
  id: string
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateMenuItemInput) => {
      const ok = await ensureFreshSession()
      if (!ok) throw new Error('Your session has expired. Please sign in again.')

      const { data, error } = await supabase
        .from('menu_items')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as MenuItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEY })
      queryClient.invalidateQueries({ queryKey: ['menuItems'] })
      broadcastInvalidate(['menu'])
      broadcastInvalidate(['menuItems'])
      toast.success('Menu item updated')
    },
    onError: (error) => {
      console.error('[useUpdateMenuItem]', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update menu item. Please try again.',
      )
    },
  })
}

// ─── Toggle availability (optimistic) ───────────────────────────
export function useToggleMenuItemAvailability() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      const ok = await ensureFreshSession()
      if (!ok) throw new Error('Your session has expired. Please sign in again.')

      const { data, error } = await supabase
        .from('menu_items')
        .update({ is_available })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as MenuItem
    },
    onMutate: async ({ id, is_available }) => {
      await queryClient.cancelQueries({ queryKey: MENU_KEY })

      const previous = queryClient.getQueriesData<MenuItem[]>({
        queryKey: ['menu', 'list'],
      })

      for (const [key, items] of previous) {
        if (!items) continue
        queryClient.setQueryData<MenuItem[]>(
          key,
          items.map((m) => (m.id === id ? { ...m, is_available } : m)),
        )
      }

      return { previous }
    },
    onError: (error, _vars, context) => {
      // Revert UI
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          queryClient.setQueryData(key, data)
        }
      }
      console.error('[useToggleMenuItemAvailability]', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update availability. Please try again.',
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEY })
      queryClient.invalidateQueries({ queryKey: ['menuItems'] })
      broadcastInvalidate(['menu'])
      broadcastInvalidate(['menuItems'])
    },
  })
}

// ─── Delete menu item (with usage guard) ────────────────────────
export class MenuItemInUseError extends Error {
  count: number
  constructor(count: number) {
    super(
      `Cannot delete — this item appears in ${count} past order${count === 1 ? '' : 's'}. Mark it as unavailable instead to hide it from new orders while keeping order history intact.`,
    )
    this.name = 'MenuItemInUseError'
    this.count = count
  }
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const ok = await ensureFreshSession()
      if (!ok) throw new Error('Your session has expired. Please sign in again.')

      const { count, error: countError } = await supabase
        .from('order_items')
        .select('id', { count: 'exact', head: true })
        .eq('menu_item_id', id)

      if (countError) throw countError
      if ((count ?? 0) > 0) {
        throw new MenuItemInUseError(count ?? 0)
      }

      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEY })
      queryClient.invalidateQueries({ queryKey: ['menuItems'] })
      broadcastInvalidate(['menu'])
      broadcastInvalidate(['menuItems'])
      toast.success('Menu item deleted')
    },
    onError: (error) => {
      console.error('[useDeleteMenuItem]', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete menu item. Please try again.',
      )
    },
  })
}
