import {
  LayoutDashboard,
  DollarSign,
  Package,
  UtensilsCrossed,
  ShoppingCart,
  CalendarCheck,
  Users,
  FileBarChart,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  ownerOnly?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Finance', href: '/finance', icon: DollarSign },
  { label: 'Inventory', href: '/inventory', icon: Package },
  { label: 'Menu', href: '/menu', icon: UtensilsCrossed },
  { label: 'Orders', href: '/orders', icon: ShoppingCart },
  { label: 'Bookings', href: '/bookings', icon: CalendarCheck },
  { label: 'Employees', href: '/employees', icon: Users },
  { label: 'Reports', href: '/reports', icon: FileBarChart },
  { label: 'Settings', href: '/settings', icon: Settings, ownerOnly: true },
]
