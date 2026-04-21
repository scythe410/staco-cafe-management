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
  ingredients: '#5B7FA6',
  utilities: '#D4882A',
  rent: '#C4622D',
  salaries: '#8B4513',
  maintenance: '#A08070',
  packaging: '#D9C9B5',
  delivery_commission: '#2C1810',
  other: '#EDE0CF',
}
