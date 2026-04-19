import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format cents (integer) as LKR with 2 decimal places.
 * e.g. 8925000 → "LKR 89,250.00"
 */
export function formatCurrency(cents: number): string {
  const amount = cents / 100
  return `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Format a date string as "dd MMM yyyy" (e.g. "19 Apr 2026").
 */
export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd MMM yyyy")
}
