export const INGREDIENT_CATEGORIES = [
  'Beverages',
  'Dry Goods',
  'Protein',
  'Produce',
  'Bakery',
  'Dairy',
  'Spices',
  'Other',
] as const

export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number]

export const INGREDIENT_UNITS = [
  'kg',
  'g',
  'litre',
  'ml',
  'piece',
  'loaf',
  'pack',
  'bottle',
  'box',
] as const

export type IngredientUnit = (typeof INGREDIENT_UNITS)[number]

export const STOCK_UPDATE_TYPES = {
  STOCK_IN: 'stock_in',
  STOCK_OUT: 'stock_out',
  ADJUSTMENT: 'adjustment',
  WASTAGE: 'wastage',
} as const

export type StockUpdateType = (typeof STOCK_UPDATE_TYPES)[keyof typeof STOCK_UPDATE_TYPES]

export const STOCK_UPDATE_TYPE_LABELS: Record<StockUpdateType, string> = {
  stock_in: 'Stock In',
  stock_out: 'Stock Out',
  adjustment: 'Adjustment',
  wastage: 'Wastage',
}
