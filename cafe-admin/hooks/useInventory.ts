import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Ingredient, Supplier } from '@/lib/types'
import type { StockUpdateType } from '@/constants/inventory'

const supabase = createBrowserClient()

// ─── Ingredients list ────────────────────────────────────────────
export function useIngredients() {
  return useQuery({
    queryKey: ['ingredients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*, suppliers(name)')
        .order('name')

      if (error) throw error
      return data as (Ingredient & { suppliers: { name: string } | null })[]
    },
  })
}

// ─── Suppliers (for dropdowns) ───────────────────────────────────
export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .order('name')

      if (error) throw error
      return data as Pick<Supplier, 'id' | 'name'>[]
    },
  })
}

// ─── Create ingredient ──────────────────────────────────────────
export interface CreateIngredientInput {
  name: string
  category: string
  unit: string
  quantity: number
  min_stock_level: number
  cost_price: number // cents
  supplier_id: string | null
  expiry_date: string | null
}

export function useCreateIngredient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateIngredientInput) => {
      const { data, error } = await supabase
        .from('ingredients')
        .insert(input)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'lowStock'] })
      queryClient.invalidateQueries({ queryKey: ['ingredients', 'lowStock'] })
      queryClient.invalidateQueries({ queryKey: ['ingredients', 'lowStockCount'] })
      queryClient.invalidateQueries({ queryKey: ['ingredients', 'lastRestock'] })
      toast.success('Ingredient added')
    },
    onError: (error) => {
      console.error('[useCreateIngredient]', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to add ingredient. Please try again.'
      )
    },
  })
}

// ─── Update ingredient ──────────────────────────────────────────
export interface UpdateIngredientInput extends Partial<CreateIngredientInput> {
  id: string
}

export function useUpdateIngredient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateIngredientInput) => {
      const { data, error } = await supabase
        .from('ingredients')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'lowStock'] })
      queryClient.invalidateQueries({ queryKey: ['ingredients', 'lowStock'] })
      queryClient.invalidateQueries({ queryKey: ['ingredients', 'lowStockCount'] })
      queryClient.invalidateQueries({ queryKey: ['ingredients', 'lastRestock'] })
      toast.success('Ingredient updated')
    },
    onError: (error) => {
      console.error('[useUpdateIngredient]', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update ingredient. Please try again.'
      )
    },
  })
}

// ─── Low stock ingredients ──────────────────────────────────────
export interface LowStockIngredient {
  id: string
  name: string
  unit: string
  quantity: number
  min_stock_level: number
  shortfall: number
}

export function useLowStockIngredients() {
  return useQuery({
    queryKey: ['ingredients', 'lowStock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('low_stock_ingredients')
        .select('id, name, unit, quantity, min_stock_level, shortfall')
        .order('shortfall', { ascending: false })

      if (error) throw error
      return (data ?? []) as LowStockIngredient[]
    },
  })
}

// ─── Low stock count (for badge) ────────────────────────────────
export function useLowStockCount() {
  return useQuery({
    queryKey: ['ingredients', 'lowStockCount'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('low_stock_ingredients')
        .select('id', { count: 'exact', head: true })

      if (error) throw error
      return count ?? 0
    },
  })
}

// ─── Last restock date per ingredient ───────────────────────────
export function useLastRestockDates(ingredientIds: string[]) {
  return useQuery({
    queryKey: ['ingredients', 'lastRestock', ingredientIds],
    enabled: ingredientIds.length > 0,
    queryFn: async () => {
      // Get the most recent stock_in for each ingredient
      const { data, error } = await supabase
        .from('stock_updates')
        .select('ingredient_id, created_at')
        .in('ingredient_id', ingredientIds)
        .eq('type', 'stock_in')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Keep only the most recent per ingredient
      const map: Record<string, string> = {}
      for (const row of data ?? []) {
        if (!map[row.ingredient_id]) {
          map[row.ingredient_id] = row.created_at
        }
      }
      return map
    },
  })
}

// ─── Stock update ───────────────────────────────────────────────
export interface StockUpdateInput {
  ingredient_id: string
  type: StockUpdateType
  quantity: number
  notes: string | null
  updated_by: string
}

export function useCreateStockUpdate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: StockUpdateInput) => {
      // The DB trigger `apply_stock_update` auto-adjusts ingredients.quantity
      const { data, error } = await supabase
        .from('stock_updates')
        .insert(input)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'lowStock'] })
      queryClient.invalidateQueries({ queryKey: ['ingredients', 'lowStock'] })
      queryClient.invalidateQueries({ queryKey: ['ingredients', 'lowStockCount'] })
      queryClient.invalidateQueries({ queryKey: ['ingredients', 'lastRestock'] })
      toast.success('Stock updated')
    },
    onError: (error) => {
      console.error('[useCreateStockUpdate]', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update stock. Please try again.'
      )
    },
  })
}
