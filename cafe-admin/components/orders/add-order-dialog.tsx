'use client'

import { useState, useMemo } from 'react'
import { Plus, Minus, Trash2, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMenuItems, useCreateOrder } from '@/hooks/useOrders'
import { formatCurrency } from '@/lib/utils'
import { validatePositiveNumber } from '@/lib/validation'
import { toast } from 'sonner'
import {
  ORDER_SOURCE,
  ORDER_SOURCE_LABELS,
  COMMISSION_SOURCES,
  PAYMENT_METHOD,
  PAYMENT_METHOD_LABELS,
  type OrderSource,
  type PaymentMethod,
} from '@/constants/orders'
import {
  MAIN_CATEGORIES,
  TOPPING_CATEGORY_LIST,
  MENU_CATEGORY_LABELS,
} from '@/constants/menu'
import type { MenuItem } from '@/lib/types'

interface LineItem {
  menu_item_id: string
  name: string
  quantity: number
  unit_price: number // cents
}

export function AddOrderDialog() {
  const [open, setOpen] = useState(false)
  const { data: menuItems } = useMenuItems()
  const createOrder = useCreateOrder()

  const [source, setSource] = useState<OrderSource>(ORDER_SOURCE.DINE_IN)
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PAYMENT_METHOD.CASH)
  const [commission, setCommission] = useState('')
  const [discount, setDiscount] = useState('')
  const [serviceCharge, setServiceCharge] = useState('')
  const [tax, setTax] = useState('')
  const [lines, setLines] = useState<LineItem[]>([])
  const [toppingsExpanded, setToppingsExpanded] = useState(false)

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.unit_price * l.quantity, 0),
    [lines],
  )

  // Convert LKR text input → cents. Negative or invalid values fall back to 0
  // (rejected on input via the change handlers below).
  const discountCents = Math.max(0, Math.round((parseFloat(discount) || 0) * 100))
  const serviceChargeCents = Math.max(0, Math.round((parseFloat(serviceCharge) || 0) * 100))
  const taxCents = Math.max(0, Math.round((parseFloat(tax) || 0) * 100))

  const total = subtotal - discountCents + serviceChargeCents + taxCents

  const discountExceedsSubtotal = discountCents > subtotal && subtotal > 0

  // Reject negative input immediately — clamp to '0' instead of waiting for submit.
  function handleNumericChange(
    setter: (v: string) => void,
  ): (e: React.ChangeEvent<HTMLInputElement>) => void {
    return (e) => {
      const v = e.target.value
      if (v === '' || parseFloat(v) >= 0) setter(v)
    }
  }

  // Set of currently-available menu item IDs — used to flag cart lines
  // whose underlying menu item was marked unavailable mid-session.
  const availableIds = useMemo(
    () => new Set((menuItems ?? []).map((m) => m.id)),
    [menuItems],
  )

  const showCommission = COMMISSION_SOURCES.includes(source)

  // Group menu items by category
  const groupedItems = useMemo(() => {
    if (!menuItems) return new Map<string, MenuItem[]>()
    const map = new Map<string, MenuItem[]>()
    for (const item of menuItems) {
      const list = map.get(item.category) ?? []
      list.push(item)
      map.set(item.category, list)
    }
    return map
  }, [menuItems])

  function addItem(item: MenuItem) {
    setLines((prev) => {
      const existing = prev.find((l) => l.menu_item_id === item.id)
      if (existing) {
        return prev.map((l) =>
          l.menu_item_id === item.id ? { ...l, quantity: l.quantity + 1 } : l,
        )
      }
      return [...prev, { menu_item_id: item.id, name: item.name, quantity: 1, unit_price: item.price }]
    })
  }

  function updateQty(menuItemId: string, delta: number) {
    setLines((prev) =>
      prev
        .map((l) =>
          l.menu_item_id === menuItemId ? { ...l, quantity: l.quantity + delta } : l,
        )
        .filter((l) => l.quantity > 0),
    )
  }

  function removeLine(menuItemId: string) {
    setLines((prev) => prev.filter((l) => l.menu_item_id !== menuItemId))
  }

  function resetForm() {
    setSource(ORDER_SOURCE.DINE_IN)
    setCustomerName('')
    setPaymentMethod(PAYMENT_METHOD.CASH)
    setCommission('')
    setDiscount('')
    setServiceCharge('')
    setTax('')
    setLines([])
    setToppingsExpanded(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (lines.length === 0) return

    if (showCommission) {
      const commErr = validatePositiveNumber(commission || '0', 'Commission', { allowZero: true })
      if (commErr) { toast.error(commErr); return }
    }

    const discountErr = validatePositiveNumber(discount || '0', 'Discount', { allowZero: true })
    if (discountErr) { toast.error(discountErr); return }
    const serviceErr = validatePositiveNumber(serviceCharge || '0', 'Service charge', { allowZero: true })
    if (serviceErr) { toast.error(serviceErr); return }
    const taxErr = validatePositiveNumber(tax || '0', 'Tax', { allowZero: true })
    if (taxErr) { toast.error(taxErr); return }

    if (discountExceedsSubtotal) return

    for (const line of lines) {
      const qtyErr = validatePositiveNumber(line.quantity, 'Item quantity')
      if (qtyErr) { toast.error(qtyErr); return }
    }

    createOrder.mutate(
      {
        source,
        customer_name: customerName.trim() || null,
        payment_method: paymentMethod,
        commission: showCommission ? Math.round(parseFloat(commission || '0') * 100) : 0,
        discount: discountCents,
        service_charge: serviceChargeCents,
        tax: taxCents,
        items: lines.map((l) => ({
          menu_item_id: l.menu_item_id,
          quantity: l.quantity,
          unit_price: l.unit_price,
        })),
      },
      {
        onSuccess: () => {
          resetForm()
          setOpen(false)
        },
      },
    )
  }

  function renderCategoryItems(categoryValue: string) {
    const items = groupedItems.get(categoryValue)
    if (!items || items.length === 0) return null
    return items.map((item) => (
      <button
        key={item.id}
        type="button"
        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
        onClick={() => addItem(item)}
      >
        <span>{item.name}</span>
        <span className="text-muted-foreground ml-2 shrink-0">{formatCurrency(item.price)}</span>
      </button>
    ))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 gap-1.5">
          <Plus className="h-4 w-4" />
          New Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Source + Customer */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={source} onValueChange={(v) => setSource(v as OrderSource)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ORDER_SOURCE).map((s) => (
                    <SelectItem key={s} value={s}>
                      {ORDER_SOURCE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Customer Name</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Optional"
                maxLength={60}
                className="h-11"
              />
            </div>
          </div>

          {/* Menu items grouped by category */}
          <div className="space-y-2">
            <Label>Add Menu Items</Label>
            <div className="rounded-lg border max-h-64 overflow-y-auto">
              {/* Main categories */}
              {MAIN_CATEGORIES.map((cat) => {
                const items = groupedItems.get(cat.value)
                if (!items || items.length === 0) return null
                return (
                  <div key={cat.value}>
                    <div className="sticky top-0 bg-muted/80 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b">
                      {cat.label}
                    </div>
                    {renderCategoryItems(cat.value)}
                  </div>
                )
              })}

              {/* Toppings — collapsible */}
              {TOPPING_CATEGORY_LIST.some((cat) => groupedItems.has(cat.value)) && (
                <div>
                  <button
                    type="button"
                    className="sticky top-0 bg-muted/80 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b w-full flex items-center gap-1"
                    onClick={() => setToppingsExpanded(!toppingsExpanded)}
                  >
                    {toppingsExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    Toppings
                  </button>
                  {toppingsExpanded && TOPPING_CATEGORY_LIST.map((cat) => {
                    const items = groupedItems.get(cat.value)
                    if (!items || items.length === 0) return null
                    return (
                      <div key={cat.value}>
                        <div className="px-3 py-1 text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider bg-muted/40">
                          {cat.label}
                        </div>
                        {renderCategoryItems(cat.value)}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Line items */}
          {lines.length > 0 && (
            <div className="space-y-2 rounded-lg border p-3">
              {lines.map((line) => {
                const unavailable = menuItems !== undefined && !availableIds.has(line.menu_item_id)
                return (
                <div key={line.menu_item_id} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 truncate flex items-center gap-1.5">
                    {unavailable && (
                      <AlertTriangle
                        className="h-3.5 w-3.5 text-amber-600 shrink-0"
                        aria-label="No longer available"
                      />
                    )}
                    {line.name}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatCurrency(line.unit_price)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQty(line.menu_item_id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center font-medium">{line.quantity}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQty(line.menu_item_id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="w-24 text-right font-medium">
                    {formatCurrency(line.unit_price * line.quantity)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => removeLine(line.menu_item_id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                )
              })}
              <div className="flex justify-between pt-2 border-t text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            </div>
          )}

          {/* Pricing adjustments — sit between items and payment method */}
          {lines.length > 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="discount-input">Discount (LKR)</Label>
                  <Input
                    id="discount-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={discount}
                    onChange={handleNumericChange(setDiscount)}
                    placeholder="0.00"
                    className="h-11"
                    aria-invalid={discountExceedsSubtotal || undefined}
                  />
                  {discountExceedsSubtotal && (
                    <p className="text-xs text-destructive">
                      Discount cannot exceed the subtotal
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="service-charge-input">Service Charge (LKR)</Label>
                  <Input
                    id="service-charge-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={serviceCharge}
                    onChange={handleNumericChange(setServiceCharge)}
                    placeholder="0.00"
                    className="h-11"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tax-input">Tax (LKR)</Label>
                  <Input
                    id="tax-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={tax}
                    onChange={handleNumericChange(setTax)}
                    placeholder="0.00"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-2 border-t font-semibold text-base">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          )}

          {/* Payment + Commission */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PAYMENT_METHOD).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PAYMENT_METHOD_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {showCommission && (
              <div className="space-y-2">
                <Label>Commission (LKR)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  placeholder="0.00"
                  className="h-11"
                />
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11"
            disabled={lines.length === 0 || createOrder.isPending || discountExceedsSubtotal}
          >
            {createOrder.isPending ? 'Creating...' : 'Create Order'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
