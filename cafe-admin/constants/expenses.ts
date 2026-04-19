export const EXPENSE_CATEGORY = {
  INGREDIENTS: 'ingredients',
  UTILITIES: 'utilities',
  RENT: 'rent',
  SALARIES: 'salaries',
  MAINTENANCE: 'maintenance',
  PACKAGING: 'packaging',
  DELIVERY_COMMISSION: 'delivery_commission',
  OTHER: 'other',
} as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORY)[keyof typeof EXPENSE_CATEGORY]

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  ingredients: 'Ingredients',
  utilities: 'Utilities',
  rent: 'Rent',
  salaries: 'Salaries',
  maintenance: 'Maintenance',
  packaging: 'Packaging',
  delivery_commission: 'Delivery Commission',
  other: 'Other',
}

export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  ingredients: '#3b82f6',
  utilities: '#f59e0b',
  rent: '#ef4444',
  salaries: '#8b5cf6',
  maintenance: '#06b6d4',
  packaging: '#10b981',
  delivery_commission: '#f97316',
  other: '#6b7280',
}
