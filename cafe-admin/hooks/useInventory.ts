import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@/lib/supabase'
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
    },
  })
}
