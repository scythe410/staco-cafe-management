'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { INGREDIENT_CATEGORIES, INGREDIENT_UNITS } from '@/constants/inventory'
import { useSuppliers } from '@/hooks/useInventory'
import type { Ingredient } from '@/lib/types'

interface IngredientFormProps {
  initial?: Ingredient & { suppliers: { name: string } | null }
  onSubmit: (values: IngredientFormValues) => void
  isPending: boolean
}

export interface IngredientFormValues {
  name: string
  category: string
  unit: string
  quantity: number
  min_stock_level: number
  cost_price: number // cents
  supplier_id: string | null
  expiry_date: string | null
}

export function IngredientForm({ initial, onSubmit, isPending }: IngredientFormProps) {
  const { data: suppliers } = useSuppliers()

  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [unit, setUnit] = useState(initial?.unit ?? '')
  const [quantity, setQuantity] = useState(initial?.quantity?.toString() ?? '')
  const [minStock, setMinStock] = useState(initial?.min_stock_level?.toString() ?? '')
  const [costPrice, setCostPrice] = useState(
    initial ? (initial.cost_price / 100).toString() : '',
  )
  const [supplierId, setSupplierId] = useState(initial?.supplier_id ?? '')
  const [expiryDate, setExpiryDate] = useState(initial?.expiry_date ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      name: name.trim(),
      category,
      unit,
      quantity: parseFloat(quantity),
      min_stock_level: parseFloat(minStock),
      cost_price: Math.round(parseFloat(costPrice) * 100),
      supplier_id: supplierId || null,
      expiry_date: expiryDate || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory} required>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {INGREDIENT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Unit</Label>
          <Select value={unit} onValueChange={setUnit} required>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              {INGREDIENT_UNITS.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" type="number" step="0.001" min="0" required value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minStock">Min Stock Level</Label>
          <Input id="minStock" type="number" step="0.001" min="0" required value={minStock} onChange={(e) => setMinStock(e.target.value)} className="h-11" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="costPrice">Cost Price (LKR)</Label>
        <Input id="costPrice" type="number" step="0.01" min="0" required value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="h-11" />
      </div>

      <div className="space-y-2">
        <Label>Supplier</Label>
        <Select value={supplierId} onValueChange={setSupplierId}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select supplier (optional)" />
          </SelectTrigger>
          <SelectContent>
            {(suppliers ?? []).map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expiryDate">Expiry Date (optional)</Label>
        <Input id="expiryDate" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="h-11" />
      </div>

      <Button type="submit" className="w-full h-11" disabled={isPending}>
        {isPending ? 'Saving...' : initial ? 'Update Item' : 'Add Item'}
      </Button>
    </form>
  )
}
