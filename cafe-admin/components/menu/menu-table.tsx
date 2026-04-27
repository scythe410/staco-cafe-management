'use client'

import { useState } from 'react'
import { Search, Pencil, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import {
  useMenuItems,
  useToggleMenuItemAvailability,
  type AvailabilityFilter,
} from '@/hooks/useMenu'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import {
  MENU_CATEGORIES,
  MENU_CATEGORY_LABELS,
  CATEGORY_BADGE_STYLES,
} from '@/constants/menu'
import { AddItemDialog } from './add-item-dialog'
import { EditItemDialog } from './edit-item-dialog'
import { DeleteItemDialog } from './delete-item-dialog'
import type { MenuItem } from '@/lib/types'

const ALL_CATEGORIES = 'all'

export function MenuTable() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES)
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all')
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<MenuItem | null>(null)

  const { data: items, isLoading, isError } = useMenuItems({
    category: categoryFilter,
    availability: availabilityFilter,
    search,
  })

  const toggleAvailability = useToggleMenuItemAvailability()

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-stretch justify-between">
        <div className="flex flex-wrap gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px] h-11">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
              {MENU_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={availabilityFilter}
            onValueChange={(v) => setAvailabilityFilter(v as AvailabilityFilter)}
          >
            <SelectTrigger className="w-[180px] h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All items</SelectItem>
              <SelectItem value="available">Available only</SelectItem>
              <SelectItem value="unavailable">Unavailable only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <AddItemDialog />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive py-8 text-center">
          Failed to load menu items
        </p>
      ) : (
        <div className="rounded-lg border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!items || items.length === 0) ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-12"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">No menu items found</p>
                      <p className="text-xs">
                        Try clearing filters or add a new menu item.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className="min-h-[44px]">
                    <TableCell className="font-medium py-3">
                      {item.name}
                      {item.notes && (
                        <p className="text-xs text-muted-foreground font-normal mt-0.5">
                          {item.notes}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        className={cn(
                          'text-xs whitespace-nowrap',
                          CATEGORY_BADGE_STYLES[item.category] ?? '',
                        )}
                      >
                        {MENU_CATEGORY_LABELS[item.category] ?? item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap py-3">
                      {formatCurrency(item.price)}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.is_available}
                          onCheckedChange={(checked) =>
                            toggleAvailability.mutate({
                              id: item.id,
                              is_available: checked,
                            })
                          }
                          aria-label={`Toggle availability for ${item.name}`}
                        />
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            item.is_available
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {item.is_available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm py-3">
                      {formatDate(item.updated_at)}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11"
                          onClick={() => setEditItem(item)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteItem(item)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
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
      <DeleteItemDialog
        item={deleteItem}
        open={!!deleteItem}
        onOpenChange={(open) => { if (!open) setDeleteItem(null) }}
      />
    </div>
  )
}
