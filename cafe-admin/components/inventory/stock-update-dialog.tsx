'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  STOCK_UPDATE_TYPES,
  STOCK_UPDATE_TYPE_LABELS,
  type StockUpdateType,
} from '@/constants/inventory'
import { useCreateStockUpdate } from '@/hooks/useInventory'
import type { Ingredient } from '@/lib/types'

interface StockUpdateDialogProps {
  item: Ingredient | null
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StockUpdateDialog({ item, userId, open, onOpenChange }: StockUpdateDialogProps) {
  const [type, setType] = useState<StockUpdateType>(STOCK_UPDATE_TYPES.STOCK_IN)
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const createStockUpdate = useCreateStockUpdate()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!item) return

    let qty = parseFloat(quantity)
    // stock_out and wastage reduce quantity, so negate
    if (type === STOCK_UPDATE_TYPES.STOCK_OUT || type === STOCK_UPDATE_TYPES.WASTAGE) {
      qty = -Math.abs(qty)
    }

    createStockUpdate.mutate(
      {
        ingredient_id: item.id,
        type,
        quantity: qty,
        notes: notes.trim() || null,
        updated_by: userId,
      },
      {
        onSuccess: () => {
          setType(STOCK_UPDATE_TYPES.STOCK_IN)
          setQuantity('')
          setNotes('')
          onOpenChange(false)
        },
      },
    )
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Stock — {item.name}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Current: {item.quantity} {item.unit}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Update Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as StockUpdateType)}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(STOCK_UPDATE_TYPES).map((t) => (
                  <SelectItem key={t} value={t}>
                    {STOCK_UPDATE_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stockQty">Quantity ({item.unit})</Label>
            <Input
              id="stockQty"
              type="number"
              step="0.001"
              min="0.001"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stockNotes">Notes (optional)</Label>
            <Textarea
              id="stockNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full h-11" disabled={createStockUpdate.isPending}>
            {createStockUpdate.isPending ? 'Saving...' : 'Record Update'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
