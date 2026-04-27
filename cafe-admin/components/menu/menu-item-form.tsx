'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MENU_CATEGORIES } from '@/constants/menu'
import { validatePositiveNumber, validateStringLength } from '@/lib/validation'
import { toast } from 'sonner'
import type { MenuItem } from '@/lib/types'

const NAME_MAX = 80
const NOTES_MAX = 200

export interface MenuItemFormValues {
  name: string
  category: string
  price: number // cents
  is_available: boolean
  notes: string | null
}

interface MenuItemFormProps {
  initial?: MenuItem
  onSubmit: (values: MenuItemFormValues) => void
  isPending: boolean
  submitLabel?: string
}

export function MenuItemForm({
  initial,
  onSubmit,
  isPending,
  submitLabel,
}: MenuItemFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [price, setPrice] = useState(
    initial ? (initial.price / 100).toString() : '',
  )
  const [isAvailable, setIsAvailable] = useState(initial?.is_available ?? true)
  const [notes, setNotes] = useState(initial?.notes ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const nameErr = validateStringLength(name, 'Name', NAME_MAX, { required: true })
    if (nameErr) { toast.error(nameErr); return }
    if (!category) { toast.error('Category is required'); return }
    const priceErr = validatePositiveNumber(price, 'Price', { allowZero: true })
    if (priceErr) { toast.error(priceErr); return }
    const notesErr = validateStringLength(notes, 'Notes', NOTES_MAX)
    if (notesErr) { toast.error(notesErr); return }

    onSubmit({
      name: name.trim(),
      category,
      price: Math.round(parseFloat(price) * 100),
      is_available: isAvailable,
      notes: notes.trim() ? notes.trim() : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="menu-name">Name</Label>
        <Input
          id="menu-name"
          required
          maxLength={NAME_MAX}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory} required>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {MENU_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="menu-price">Price (LKR)</Label>
          <Input
            id="menu-price"
            type="number"
            step="0.01"
            min="0"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-11"
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
        <div className="space-y-0.5">
          <Label htmlFor="menu-available" className="cursor-pointer">
            Available
          </Label>
          <p className="text-xs text-muted-foreground">
            Visible in new orders when on
          </p>
        </div>
        <Switch
          id="menu-available"
          checked={isAvailable}
          onCheckedChange={setIsAvailable}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="menu-notes">Notes (optional)</Label>
        <Textarea
          id="menu-notes"
          maxLength={NOTES_MAX}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder='e.g. "1 waffle" or "Marshmallow + Crackers"'
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full h-11" disabled={isPending}>
        {isPending ? 'Saving...' : submitLabel ?? (initial ? 'Update Item' : 'Add Item')}
      </Button>
    </form>
  )
}
