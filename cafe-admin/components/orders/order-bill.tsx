'use client'

import { formatCurrency, escapeHtml } from '@/lib/utils'
import {
  ORDER_SOURCE_LABELS,
  COMMISSION_SOURCES,
  PAYMENT_METHOD_LABELS,
  type OrderSource,
  type PaymentMethod,
} from '@/constants/orders'
import { format } from 'date-fns'
import type { OrderDetail } from '@/hooks/useOrders'

export function getBillHtml(order: OrderDetail): string {
  const hasCommission = COMMISSION_SOURCES.includes(order.source as OrderSource)
  const finalTotal = order.total_amount - order.discount + order.tax - (hasCommission ? order.commission : 0)
  const orderIdShort = order.id.slice(-8).toUpperCase()
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  const itemsHtml = order.order_items.map((item) => {
    const name = escapeHtml(item.menu_items?.name ?? 'Item')
    const lineTotal = item.unit_price * item.quantity
    return `<tr>
      <td>${name}</td>
      <td class="num">${item.quantity}</td>
      <td class="num">${formatCurrency(item.unit_price)}</td>
      <td class="num">${formatCurrency(lineTotal)}</td>
    </tr>`
  }).join('')

  let totalsHtml = `<tr><td>Subtotal</td><td class="num">${formatCurrency(order.total_amount)}</td></tr>`
  if (order.discount > 0) {
    totalsHtml += `<tr><td>Discount</td><td class="num" style="color:#dc2626;">-${formatCurrency(order.discount)}</td></tr>`
  }
  if (order.tax > 0) {
    totalsHtml += `<tr><td>Tax</td><td class="num">+${formatCurrency(order.tax)}</td></tr>`
  }
  if (hasCommission && order.commission > 0) {
    totalsHtml += `<tr><td>Commission</td><td class="num" style="color:#dc2626;">-${formatCurrency(order.commission)}</td></tr>`
  }

  const paymentLabel = order.payment_method
    ? PAYMENT_METHOD_LABELS[order.payment_method as PaymentMethod]
    : '—'

  return `
    <!-- Header -->
    <div class="header">
      <img src="${origin}/logos/logo-text.png" alt="Stacko Cafe" class="logo-main" />
      <p class="tagline">Come for the treats, you'll stay for the feeling.</p>
    </div>

    <div class="divider"></div>

    <!-- Order info -->
    <table class="meta-table">
      <tr><td class="meta-label">Bill No</td><td class="meta-value">#STC-${orderIdShort}</td></tr>
      <tr><td class="meta-label">Date</td><td class="meta-value">${format(new Date(order.created_at), 'dd MMM yyyy')}</td></tr>
      <tr><td class="meta-label">Time</td><td class="meta-value">${format(new Date(order.created_at), 'h:mm a')}</td></tr>
      <tr><td class="meta-label">Type</td><td class="meta-value">${ORDER_SOURCE_LABELS[order.source as OrderSource]}</td></tr>
      <tr><td class="meta-label">Customer</td><td class="meta-value">${escapeHtml(order.customer_name || '—')}</td></tr>
    </table>

    <div class="divider"></div>

    <!-- Items -->
    <table class="items-table">
      <thead>
        <tr>
          <th>Item</th>
          <th class="num">Qty</th>
          <th class="num">Price</th>
          <th class="num">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Totals -->
    <table class="totals-table">
      <tbody>
        ${totalsHtml}
      </tbody>
      <tfoot>
        <tr class="grand-total">
          <td>TOTAL</td>
          <td class="num">${formatCurrency(finalTotal)}</td>
        </tr>
      </tfoot>
    </table>

    <!-- Payment -->
    <div class="payment-row">
      <span>Payment Method</span>
      <span class="payment-value">${paymentLabel}</span>
    </div>

    <div class="divider"></div>

    <!-- Thank you -->
    <div class="thank-you">
      <p class="thank-you-title">Thank you for visiting Stacko Cafe!</p>
      <p class="thank-you-sub">Please come again.</p>
    </div>

    <div class="divider"></div>

    <!-- Powered by -->
    <div class="powered-by">
      <p class="powered-by-label">powered by</p>
      <img src="${origin}/logos/neuralshift-logo.png" alt="NeuralShift" class="logo-ns" />
    </div>
  `
}

export function getOrderPrintTitle(order: OrderDetail): string {
  const orderIdShort = order.id.slice(-8)
  const formattedDate = format(new Date(order.created_at), 'yyyy-MM-dd')
  return `Stacko-Cafe-Bill-${orderIdShort}-${formattedDate}`
}

export const BILL_STYLES = `
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

  /* Header */
  .header { text-align: center; padding: 8px 0; }
  .logo-main { height: 64px; display: block; margin: 0 auto; }
  .tagline { font-size: 9px; font-style: italic; color: #666; margin-top: 4px; }

  /* Divider */
  .divider { border-top: 1px dashed #ccc; margin: 10px 0; }

  /* Meta table */
  .meta-table { width: 100%; border-collapse: collapse; }
  .meta-table td { padding: 2px 0; font-size: 11px; border: none; }
  .meta-label { color: #666; width: 70px; }
  .meta-value { font-weight: 600; text-align: right; }

  /* Items table */
  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  .items-table th {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #666;
    padding: 6px 4px;
    border-bottom: 1.5px solid #ddd;
    background: #f9f9f9;
  }
  .items-table td {
    padding: 5px 4px;
    font-size: 11px;
    border-bottom: 1px solid #eee;
    word-break: break-word;
  }

  /* Totals table */
  .totals-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  .totals-table td {
    padding: 3px 4px;
    font-size: 11px;
    border: none;
  }
  .grand-total td {
    font-size: 15px;
    font-weight: 700;
    padding-top: 8px;
    border-top: 1.5px solid #333;
  }

  /* Shared */
  .num { text-align: right; }
  th.num { text-align: right; }

  /* Payment */
  .payment-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    padding: 8px 0;
    border-top: 1px dashed #ccc;
    margin-top: 10px;
  }
  .payment-value { font-weight: 700; }

  /* Thank you */
  .thank-you { text-align: center; padding: 8px 0; }
  .thank-you-title { font-weight: 600; font-size: 12px; }
  .thank-you-sub { font-size: 10px; color: #666; margin-top: 2px; }

  /* Powered by */
  .powered-by { text-align: center; padding: 6px 0 4px; }
  .powered-by-label { font-size: 9px; color: #999; margin-bottom: 4px; }
  .logo-ns { height: 16px; display: block; margin: 0 auto; }
  .powered-by-sub { font-size: 9px; color: #999; margin-top: 3px; }

  @media print {
    @page { margin: 0; size: 80mm auto; }
    body { width: 80mm; }
  }
`
