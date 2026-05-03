// All database types — import from here, never define inline

import type { Role } from '@/constants/roles'

export interface User {
  id: string
  email: string
  full_name: string
  role: Role
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  full_name: string
  role: string
  contact: string | null
  joining_date: string | null
  salary_type: 'monthly' | 'daily' | 'hourly'
  base_salary: number // cents
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  name: string
  contact: string | null
  supplied_items: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Ingredient {
  id: string
  name: string
  category: string
  unit: string
  quantity: number
  min_stock_level: number
  cost_price: number // cents
  supplier_id: string | null
  expiry_date: string | null
  created_at: string
  updated_at: string
}

export interface MenuItem {
  id: string
  name: string
  category: string
  price: number // cents
  is_available: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface RecipeItem {
  id: string
  menu_item_id: string
  ingredient_id: string
  quantity_used: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  source: 'dine_in' | 'takeaway' | 'pickmefood' | 'ubereats' | 'other'
  status: 'new_order' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'refunded'
  customer_name: string | null
  total_amount: number    // cents — final total (subtotal − discount + service_charge + tax)
  discount: number        // cents
  service_charge: number  // cents
  tax: number             // cents
  commission: number      // cents
  payment_method: 'cash' | 'card' | 'online' | 'other' | null
  created_at: string
  completed_at: string | null
  updated_at: string
  is_archived: boolean
  archived_at: string | null
  archived_by: string | null
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  unit_price: number // cents
  created_at: string
}

export interface Expense {
  id: string
  category: 'ingredients' | 'utilities' | 'rent' | 'salaries' | 'maintenance' | 'packaging' | 'delivery_commission' | 'other'
  amount: number // cents
  description: string | null
  date: string
  recorded_by: string
  created_at: string
  updated_at: string
  is_archived: boolean
  archived_at: string | null
  archived_by: string | null
}

export interface Salary {
  id: string
  employee_id: string
  month: string
  base_salary: number  // cents
  overtime: number     // cents
  advances: number     // cents
  deductions: number   // cents
  net_salary: number   // cents
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface StockUpdate {
  id: string
  ingredient_id: string
  type: 'stock_in' | 'stock_out' | 'adjustment' | 'wastage'
  quantity: number
  notes: string | null
  updated_by: string
  created_at: string
}

export interface Notification {
  id: string
  type: 'low_stock' | 'salary_due' | 'order' | 'system' | 'booking'
  message: string
  is_read: boolean
  created_at: string
  is_archived: boolean
  archived_at: string | null
  archived_by: string | null
}

export interface Booking {
  id: string
  booking_code: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  party_size: number
  occasion: string | null
  booking_date: string         // yyyy-MM-dd
  start_time: string           // HH:mm:ss
  end_time: string             // HH:mm:ss
  table_or_area: string | null
  special_notes: string | null
  subtotal: number             // cents (food)
  booking_fee: number          // cents (venue/booking charge)
  discount: number             // cents
  service_charge: number       // cents
  tax: number                  // cents
  total_amount: number         // cents
  deposit_paid: number         // cents
  deposit_method: string | null
  balance_due: number          // cents
  status: 'tentative' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  source: 'walk_in' | 'phone' | 'whatsapp' | 'email'
  created_by: string | null
  created_at: string
  updated_at: string
  cancelled_at: string | null
  cancellation_reason: string | null
  is_archived: boolean
  archived_at: string | null
  archived_by: string | null
}

export interface BookingItem {
  id: string
  booking_id: string
  menu_item_id: string
  quantity: number
  unit_price: number  // cents
  notes: string | null
  created_at: string
}

export interface BookingPayment {
  id: string
  booking_id: string
  amount: number  // cents
  method: string
  type: 'deposit' | 'balance' | 'refund'
  reference: string | null
  recorded_by: string | null
  created_at: string
}
