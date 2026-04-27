'use client'

import { formatCurrency, escapeHtml } from '@/lib/utils'
import {
  BOOKING_STATUS_LABELS,
  BOOKING_PAYMENT_METHOD_LABELS,
  type BookingStatus,
  type BookingPaymentMethod,
} from '@/constants/bookings'
import { format, parse, differenceInMinutes } from 'date-fns'
import type { BookingDetail } from '@/hooks/useBookings'

function trimSeconds(t: string): string {
  return t.length >= 5 ? t.slice(0, 5) : t
}

function formatDuration(start: string, end: string): string {
  const s = parse(trimSeconds(start), 'HH:mm', new Date())
  const e = parse(trimSeconds(end), 'HH:mm', new Date())
  const mins = Math.max(0, differenceInMinutes(e, s))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m} mins`
  if (m === 0) return `${h} ${h === 1 ? 'hour' : 'hours'}`
  return `${h} ${h === 1 ? 'hour' : 'hours'} ${m} mins`
}

function fmtTime(t: string): string {
  return format(parse(trimSeconds(t), 'HH:mm', new Date()), 'h:mm a')
}

export function getBookingReceiptHtml(booking: BookingDetail): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const date = new Date(booking.booking_date + 'T00:00:00')
  const balance = booking.total_amount - booking.deposit_paid

  const itemsHtml = booking.booking_items.map((item) => {
    const name = escapeHtml(item.menu_items?.name ?? 'Item')
    const lineTotal = item.unit_price * item.quantity
    const noteRow = item.notes
      ? `<tr><td colspan="3" class="item-note">↳ ${escapeHtml(item.notes)}</td></tr>`
      : ''
    return `<tr>
      <td>${name}</td>
      <td class="num">${item.quantity}</td>
      <td class="num">${formatCurrency(lineTotal)}</td>
    </tr>${noteRow}`
  }).join('')

  let totalsRows = `<tr><td>Food Subtotal</td><td class="num">${formatCurrency(booking.subtotal)}</td></tr>`
  if (booking.booking_fee > 0) {
    totalsRows += `<tr><td>Booking Fee</td><td class="num">+${formatCurrency(booking.booking_fee)}</td></tr>`
  }
  if (booking.discount > 0) {
    totalsRows += `<tr><td>Discount</td><td class="num" style="color:#dc2626;">-${formatCurrency(booking.discount)}</td></tr>`
  }
  if (booking.service_charge > 0) {
    totalsRows += `<tr><td>Service Charge</td><td class="num">+${formatCurrency(booking.service_charge)}</td></tr>`
  }
  if (booking.tax > 0) {
    totalsRows += `<tr><td>Tax</td><td class="num">+${formatCurrency(booking.tax)}</td></tr>`
  }

  const depositLine = booking.deposit_paid > 0
    ? `<tr><td>Deposit Paid<br/><span class="meta-muted">(${escapeHtml(BOOKING_PAYMENT_METHOD_LABELS[booking.deposit_method as BookingPaymentMethod] ?? booking.deposit_method ?? '—')})</span></td><td class="num" style="color:#dc2626;">-${formatCurrency(booking.deposit_paid)}</td></tr>`
    : ''

  let balanceBlock: string
  if (balance > 0) {
    balanceBlock = `<tr class="grand-total"><td>BALANCE DUE</td><td class="num">${formatCurrency(balance)}</td></tr>`
  } else if (balance < 0) {
    balanceBlock =
      `<tr class="paid-full"><td colspan="2" style="text-align:center;">PAID IN FULL</td></tr>` +
      `<tr class="change-due"><td>CHANGE DUE TO CUSTOMER</td><td class="num">${formatCurrency(-balance)}</td></tr>`
  } else {
    balanceBlock = `<tr class="paid-full"><td colspan="2" style="text-align:center;">PAID IN FULL</td></tr>`
  }

  const notesBlock = booking.special_notes
    ? `<div class="divider"></div>
       <div class="section-title">SPECIAL NOTES</div>
       <p class="notes-block">${escapeHtml(booking.special_notes)}</p>`
    : ''

  const occasionLine = booking.occasion
    ? `<tr><td class="meta-label">Occasion</td><td class="meta-value">${escapeHtml(booking.occasion)}</td></tr>`
    : `<tr><td class="meta-label">Occasion</td><td class="meta-value">—</td></tr>`

  return `
    <div class="header">
      <img src="${origin}/logos/logo-text.png" alt="Stacko Cafe" class="logo-main" />
      <p class="tagline">Come for the treats, you'll stay for the feeling.</p>
    </div>
    <div class="divider"></div>
    <p class="doc-title">BOOKING RECEIPT</p>
    <div class="divider"></div>

    <table class="meta-table">
      <tr><td class="meta-label">Booking</td><td class="meta-value mono">${escapeHtml(booking.booking_code)}</td></tr>
      <tr><td class="meta-label">Status</td><td class="meta-value">${BOOKING_STATUS_LABELS[booking.status as BookingStatus]}</td></tr>
      <tr><td class="meta-label">Issued</td><td class="meta-value">${format(new Date(), 'dd MMM yyyy h:mm a')}</td></tr>
    </table>

    <div class="divider"></div>
    <div class="section-title">CUSTOMER</div>
    <table class="meta-table">
      <tr><td class="meta-label">Name</td><td class="meta-value">${escapeHtml(booking.customer_name)}</td></tr>
      <tr><td class="meta-label">Phone</td><td class="meta-value">${escapeHtml(booking.customer_phone)}</td></tr>
      <tr><td class="meta-label">Email</td><td class="meta-value">${escapeHtml(booking.customer_email ?? '—')}</td></tr>
    </table>

    <div class="divider"></div>
    <div class="section-title">EVENT DETAILS</div>
    <table class="meta-table">
      ${occasionLine}
      <tr><td class="meta-label">Date</td><td class="meta-value">${format(date, 'dd MMM yyyy (EEEE)')}</td></tr>
      <tr><td class="meta-label">Time</td><td class="meta-value">${fmtTime(booking.start_time)} – ${fmtTime(booking.end_time)}</td></tr>
      <tr><td class="meta-label">Duration</td><td class="meta-value">${formatDuration(booking.start_time, booking.end_time)}</td></tr>
      <tr><td class="meta-label">Party</td><td class="meta-value">${booking.party_size} people</td></tr>
      <tr><td class="meta-label">Area</td><td class="meta-value">${escapeHtml(booking.table_or_area ?? '—')}</td></tr>
    </table>

    ${notesBlock}

    <div class="divider"></div>
    <div class="section-title">PRE-ORDERED ITEMS</div>
    <table class="items-table">
      <thead>
        <tr>
          <th>Item</th>
          <th class="num">Qty</th>
          <th class="num">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <table class="totals-table">
      <tbody>
        ${totalsRows}
      </tbody>
      <tfoot>
        <tr class="grand-total">
          <td>TOTAL</td>
          <td class="num">${formatCurrency(booking.total_amount)}</td>
        </tr>
        ${depositLine}
        ${balanceBlock}
      </tfoot>
    </table>

    <div class="divider"></div>
    <div class="section-title small">TERMS &amp; CONDITIONS</div>
    <ul class="terms">
      <li>Deposit is non-refundable if cancelled within 24 hours of booking.</li>
      <li>Final headcount must be confirmed 24 hours in advance.</li>
      <li>Outside food and beverages not permitted unless agreed.</li>
      <li>Booking confirmed only upon deposit payment.</li>
    </ul>

    <div class="divider"></div>
    <p class="contact-note">
      For changes or queries, please contact us
      referencing booking code <span class="mono">${escapeHtml(booking.booking_code)}</span>.
    </p>
    <p class="thank-you-title">Thank you and see you soon!</p>

    <div class="divider"></div>
    <div class="powered-by">
      <p class="powered-by-label">— powered by —</p>
      <img src="${origin}/logos/neuralshift-logo.png" alt="NeuralShift" class="logo-ns" />
      <p class="powered-by-sub">Cafe Management System</p>
    </div>
  `
}

export function getBookingPrintTitle(booking: BookingDetail): string {
  return `Staco-Cafe-Booking-${booking.booking_code}-${booking.booking_date}`
}

export const BOOKING_RECEIPT_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 12px;
    color: #111;
    background: #fff;
    width: 80mm;
    padding: 10px 12px;
    line-height: 1.5;
  }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }

  .header { text-align: center; padding: 8px 0; }
  .logo-main { height: 64px; display: block; margin: 0 auto; }
  .tagline { font-size: 9px; font-style: italic; color: #666; margin-top: 4px; }

  .divider { border-top: 1px dashed #ccc; margin: 10px 0; }

  .doc-title {
    text-align: center;
    font-weight: 700;
    font-size: 13px;
    letter-spacing: 1px;
  }

  .section-title {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.6px;
    color: #555;
    margin-bottom: 4px;
  }
  .section-title.small { font-size: 9px; }

  .meta-table { width: 100%; border-collapse: collapse; }
  .meta-table td { padding: 2px 0; font-size: 11px; border: none; vertical-align: top; }
  .meta-label { color: #666; width: 80px; }
  .meta-value { font-weight: 600; text-align: right; }
  .meta-muted { font-weight: 400; color: #888; font-size: 9px; }

  .notes-block {
    background: #f6f4ef;
    padding: 6px 8px;
    border-radius: 4px;
    font-size: 11px;
    white-space: pre-wrap;
  }

  .items-table { width: 100%; border-collapse: collapse; }
  .items-table th {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #666;
    padding: 6px 4px;
    border-bottom: 1.5px solid #ddd;
    background: #f9f9f9;
    text-align: left;
  }
  .items-table td {
    padding: 5px 4px;
    font-size: 11px;
    border-bottom: 1px solid #eee;
    word-break: break-word;
  }
  .item-note {
    font-size: 9px;
    font-style: italic;
    color: #777;
    padding-left: 18px;
    border-bottom: 1px solid #eee;
  }

  .totals-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  .totals-table td {
    padding: 3px 4px;
    font-size: 11px;
    border: none;
  }
  .grand-total td {
    font-size: 14px;
    font-weight: 700;
    padding-top: 6px;
    border-top: 1.5px solid #333;
  }
  .paid-full td {
    font-size: 13px;
    font-weight: 700;
    padding-top: 8px;
    border-top: 1.5px solid #333;
    color: #15803d;
  }
  .change-due td {
    font-size: 12px;
    font-weight: 700;
    padding-top: 4px;
    color: #15803d;
  }

  .terms {
    list-style: none;
    padding: 0;
    font-size: 8px;
    color: #555;
  }
  .terms li {
    padding-left: 8px;
    text-indent: -8px;
    margin-bottom: 1px;
  }
  .terms li:before { content: "- "; }

  .num { text-align: right; }
  th.num { text-align: right; }

  .contact-note {
    font-size: 10px;
    color: #555;
    text-align: center;
    margin-bottom: 6px;
  }

  .thank-you-title { font-weight: 600; font-size: 12px; text-align: center; }

  .powered-by { text-align: center; padding: 6px 0 4px; }
  .powered-by-label { font-size: 9px; color: #999; margin-bottom: 4px; }
  .logo-ns { height: 16px; display: block; margin: 0 auto; }
  .powered-by-sub { font-size: 9px; color: #999; margin-top: 3px; }

  @media print {
    @page { margin: 0; size: 80mm auto; }
    body { width: 80mm; }
  }
`
