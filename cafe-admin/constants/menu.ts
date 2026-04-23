export const MENU_CATEGORIES = [
  { value: 'coffee',            label: 'Coffee Specialties' },
  { value: 'matcha',            label: 'Matcha Drinks' },
  { value: 'shakes',            label: 'Shakes' },
  { value: 'waffles',           label: 'Signature Waffles' },
  { value: 'desserts',          label: 'Desserts' },
  { value: 'toppings_scoop',    label: 'Toppings — Scoop' },
  { value: 'toppings_drizzle',  label: 'Toppings — Drizzles' },
  { value: 'toppings_spread',   label: 'Toppings — Spreads' },
  { value: 'toppings_savoury',  label: 'Toppings — Savoury Bites' },
] as const

export type MenuCategory = typeof MENU_CATEGORIES[number]['value']

export const MENU_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  MENU_CATEGORIES.map((c) => [c.value, c.label]),
)

export const TOPPING_CATEGORIES: MenuCategory[] = [
  'toppings_scoop',
  'toppings_drizzle',
  'toppings_spread',
  'toppings_savoury',
]

export const MAIN_CATEGORIES = MENU_CATEGORIES.filter(
  (c) => !TOPPING_CATEGORIES.includes(c.value),
)

export const TOPPING_CATEGORY_LIST = MENU_CATEGORIES.filter(
  (c) => TOPPING_CATEGORIES.includes(c.value),
)

// Badge colour classes per category group
export const CATEGORY_BADGE_STYLES: Record<string, string> = {
  coffee:            'bg-[#8B4513] text-[#F5ECD7]',
  matcha:            'bg-[#8B4513] text-[#F5ECD7]',
  shakes:            'bg-[#8B4513] text-[#F5ECD7]',
  waffles:           'bg-[#C4622D] text-[#F5ECD7]',
  desserts:          'bg-[#C4622D] text-[#F5ECD7]',
  toppings_scoop:    'bg-[#D9C9B5] text-[#1C1008]',
  toppings_drizzle:  'bg-[#D9C9B5] text-[#1C1008]',
  toppings_spread:   'bg-[#D9C9B5] text-[#1C1008]',
  toppings_savoury:  'bg-[#D9C9B5] text-[#1C1008]',
}
