'use client'

import { useState, useMemo } from 'react'
import { Plus, Minus, Trash2 } from 'lucide-react'
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
import {
  ORDER_SOURCE,
  ORDER_SOURCE_LABELS,
  COMMISSION_SOURCES,
  PAYMENT_METHOD,
  PAYMENT_METHOD_LABELS,
  type OrderSource,
  type PaymentMethod,
} from '@/constants/orders'

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
  const [lines, setLines] = useState<LineItem[]>([])

  const total = useMemo(
    () => lines.reduce((sum, l) => sum + l.unit_price * l.quantity, 0),
    [lines],
  )

  const showCommission = COMMISSION_SOURCES.includes(source)

  function addItem(menuItemId: string) {
    const item = menuItems?.find((m) => m.id === menuItemId)
    if (!item) return

    setLines((prev) => {
      const existing = prev.find((l) => l.menu_item_id === menuItemId)
      if (existing) {
        return prev.map((l) =>
          l.menu_item_id === menuItemId ? { ...l, quantity: l.quantity + 1 } : l,
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
    setLines([])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (lines.length === 0) return

    createOrder.mutate(
      {
        source,
        customer_name: customerName.trim() || null,
        payment_method: paymentMethod,
        commission: showCommission ? Math.round(parseFloat(commission || '0') * 100) : 0,
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

  // Group menu items by category for the selector
  const categories = useMemo(() => {
    if (!menuItems) return []
    const cats = new Map<string, typeof menuItems>()
    for (const item of menuItems) {
      const list = cats.get(item.category) ?? []
      list.push(item)
      cats.set(item.category, list)
    }
    return Array.from(cats.entries())
  }, [menuItems])

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
                className="h-11"
              />
            </div>
          </div>

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

          {/* Add items */}
          <div className="space-y-2">
            <Label>Add Menu Items</Label>
            <Select onValueChange={addItem} value="">
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select an item to add..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map(([cat, items]) => (
                  <div key={cat}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{cat}</div>
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} — {formatCurrency(item.price)}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Line items */}
          {lines.length > 0 && (
            <div className="space-y-2 rounded-lg border p-3">
              {lines.map((line) => (
                <div key={line.menu_item_id} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 truncate">{line.name}</span>
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
              ))}
              <div className="flex justify-between pt-2 border-t font-semibold text-sm">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11"
            disabled={lines.length === 0 || createOrder.isPending}
          >
            {createOrder.isPending ? 'Creating...' : 'Create Order'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
