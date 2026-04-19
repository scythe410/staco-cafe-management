'use client'

import { useState, useMemo } from 'react'
import { Search, Pencil, PackagePlus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { useIngredients } from '@/hooks/useInventory'
import { formatCurrency } from '@/lib/utils'
import { INGREDIENT_CATEGORIES } from '@/constants/inventory'
import { AddItemDialog } from './add-item-dialog'
import { EditItemDialog } from './edit-item-dialog'
import { StockUpdateDialog } from './stock-update-dialog'
import type { Ingredient } from '@/lib/types'

const ALL_CATEGORIES = 'all'

type IngredientRow = Ingredient & { suppliers: { name: string } | null }

function getStockColor(quantity: number, minStock: number): string {
  if (quantity < minStock) return 'text-destructive'
  if (quantity < minStock * 1.2) return 'text-amber-600'
  return 'text-emerald-600'
}

interface InventoryTableProps {
  userId: string
}

export function InventoryTable({ userId }: InventoryTableProps) {
  const { data: ingredients, isLoading, isError } = useIngredients()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES)
  const [editItem, setEditItem] = useState<IngredientRow | null>(null)
  const [stockItem, setStockItem] = useState<IngredientRow | null>(null)

  const filtered = useMemo(() => {
    if (!ingredients) return []
    let result = ingredients
    if (categoryFilter !== ALL_CATEGORIES) {
      result = result.filter((i) => i.category === categoryFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((i) => i.name.toLowerCase().includes(q))
    }
    return result
  }, [ingredients, search, categoryFilter])

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ingredients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px] h-11">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
              {INGREDIENT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <AddItemDialog />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive py-8 text-center">Failed to load inventory data</p>
      ) : (
        <div className="rounded-lg border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Min Stock</TableHead>
                <TableHead className="text-right">Cost Price</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No ingredients found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${getStockColor(item.quantity, item.min_stock_level)}`}>
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {item.min_stock_level} {item.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.cost_price)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.suppliers?.name ?? '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setEditItem(item)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setStockItem(item)}
                          title="Stock update"
                        >
                          <PackagePlus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <EditItemDialog
        item={editItem}
        open={!!editItem}
        onOpenChange={(open) => { if (!open) setEditItem(null) }}
      />
      <StockUpdateDialog
        item={stockItem}
        userId={userId}
        open={!!stockItem}
        onOpenChange={(open) => { if (!open) setStockItem(null) }}
      />
    </div>
  )
}
