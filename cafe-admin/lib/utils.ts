import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { toast } from "sonner"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format cents (integer) as LKR with 2 decimal places.
 * e.g. 8925000 → "LKR 89,250.00"
 */
export function formatCurrency(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || Number.isNaN(cents)) {
    return 'LKR 0.00'
  }
  const lkr = cents / 100
  return `LKR ${lkr.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Format a date string as "dd MMM yyyy" (e.g. "19 Apr 2026").
 */
export function formatDate(input: string | Date | null | undefined): string {
  if (!input) return '—'
  try {
    const date = typeof input === 'string' ? new Date(input) : input
    if (isNaN(date.getTime())) return '—'
    return format(date, 'dd MMM yyyy')
  } catch {
    return '—'
  }
}

/**
 * Escape a string for safe insertion into HTML (prevents XSS).
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

/**
 * Convert a 2D array (headers + rows) to CSV and trigger a download.
 */
export function downloadCSV(headers: string[], rows: string[][], filename: string) {
  const escape = (v: string) => {
    if (v.includes(",") || v.includes('"') || v.includes("\n")) {
      return `"${v.replace(/"/g, '""')}"`
    }
    return v
  }
  const csv = [headers.map(escape).join(",")]
    .concat(rows.map((row) => row.map(escape).join(",")))
    .join("\n")

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Open a print-optimised window with the given HTML content.
 */
export function printReport(title: string, bodyHtml: string) {
  const w = window.open("", "_blank", "width=800,height=900")
  if (!w) {
    toast.error('Popup blocked. Please allow popups for this site and try again.')
    return
  }
  w.document.write(`<!DOCTYPE html>
<html><head><title>${title}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; max-width: 700px; margin: 0 auto; color: #111; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  h2 { font-size: 14px; color: #666; font-weight: normal; margin-top: 0; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th, td { padding: 6px 8px; font-size: 13px; text-align: left; border-bottom: 1px solid #e5e5e5; }
  th { font-weight: 600; background: #f9f9f9; }
  td.num { text-align: right; }
  th.num { text-align: right; }
  .low-stock { color: #dc2626; font-weight: 600; }
  .summary { margin-top: 16px; padding: 16px; background: #f9f9f9; border-radius: 8px; }
  .summary p { margin: 4px 0; font-size: 14px; }
  .footer { margin-top: 40px; font-size: 11px; color: #999; }
  @media print { body { padding: 20px; } .no-print { display: none; } }
</style></head><body>
${bodyHtml}
<p class="footer">Stacko Cafe — Generated on ${formatDate(new Date())}</p>
</body></html>`)
  w.document.close()
  w.print()
}
