// Role constants — import from here, never hardcode role strings
export const ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  INVENTORY: 'inventory',
  KITCHEN: 'kitchen',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

// Routes each role is permitted to access (prefix-based)
// A role may access a route if any listed prefix matches the pathname start.
// owner is implicitly allowed everywhere — checked first in proxy.
export const ROLE_ALLOWED_ROUTES: Record<Role, string[]> = {
  owner: ['/'],                                          // full access
  manager: ['/dashboard', '/orders', '/inventory', '/finance', '/reports', '/notifications'],
  cashier: ['/dashboard', '/orders'],
  inventory: ['/dashboard', '/inventory'],
  kitchen: ['/dashboard', '/orders/kitchen'],
}

// Routes accessible to any authenticated user regardless of role
export const PUBLIC_AUTH_ROUTES: string[] = [
  '/auth',
]
