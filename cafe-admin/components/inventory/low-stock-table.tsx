'use client'

import { useState, useMemo } from 'react'
import { PackagePlus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useLowStockIngredients,
  useLastRestockDates,
  type LowStockIngredient,
} from '@/hooks/useInventory'
import { StockUpdateDialog } from './stock-update-dialog'
import type { Ingredient } from '@/lib/types'
import { format } from 'date-fns'

interface LowStockTableProps {
  userId: string
}

export function LowStockTable({ userId }: LowStockTableProps) {
  const { data: items, isLoading, isError } = useLowStockIngredients()
  const ingredientIds = useMemo(() => (items ?? []).map((i) => i.id), [items])
  const { data: restockDates } = useLastRestockDates(ingredientIds)
  const [stockItem, setStockItem] = useState<Ingredient | null>(null)

  function handleRestock(item: LowStockIngredient) {
    // Build a minimal Ingredient to pass to StockUpdateDialog
    setStockItem({
      id: item.id,
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      min_stock_level: item.min_stock_level,
      category: '',
      cost_price: 0,
      supplier_id: null,
      expiry_date: null,
      created_at: '',
      updated_at: '',
    } satisfies Ingredient)
  }

  return (
    <div className="space-y-4">
      <Link
        href="/inventory"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Inventory
      </Link>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive py-8 text-center">
          Failed to load low stock data
        </p>
      ) : !items || items.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">All stock levels are healthy</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Current Qty</TableHead>
                <TableHead className="text-right">Min Level</TableHead>
                <TableHead className="text-right">Shortfall</TableHead>
                <TableHead>Last Restock</TableHead>
                <TableHead className="w-[140px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const lastRestock = restockDates?.[item.id]
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right text-destructive font-medium">
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {item.min_stock_level} {item.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive" className="text-xs">
                        -{item.shortfall} {item.unit}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lastRestock
                        ? format(new Date(lastRestock), 'dd MMM yyyy')
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-1.5"
                        onClick={() => handleRestock(item)}
                      >
                        <PackagePlus className="h-4 w-4" />
                        Restock
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <StockUpdateDialog
        item={stockItem}
        userId={userId}
        open={!!stockItem}
        onOpenChange={(open) => {
          if (!open) setStockItem(null)
        }}
      />
    </div>
  )
}
