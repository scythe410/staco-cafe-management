'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
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
import { useOrders, type OrderFilters } from '@/hooks/useOrders'
import { formatCurrency, cn } from '@/lib/utils'
import {
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VARIANT,
  ORDER_SOURCE,
  ORDER_SOURCE_LABELS,
  ORDER_SOURCE_COLORS,
  PAYMENT_METHOD,
  PAYMENT_METHOD_LABELS,
  type OrderStatus,
  type OrderSource,
  type PaymentMethod,
} from '@/constants/orders'
import { AddOrderDialog } from './add-order-dialog'
import { OrderDetailDialog } from './order-detail-dialog'
import { format } from 'date-fns'

const ALL = 'all'

export function OrdersTable() {
  const [filters, setFilters] = useState<OrderFilters>({})
  const [search, setSearch] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const appliedFilters: OrderFilters = {
    ...filters,
    search: search.trim() || undefined,
  }

  const { data: orders, isLoading, isError } = useOrders(appliedFilters)

  function setFilter<K extends keyof OrderFilters>(key: K, value: OrderFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11"
            />
          </div>
          <AddOrderDialog />
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.source ?? ALL}
            onValueChange={(v) => setFilter('source', v as OrderSource | 'all')}
          >
            <SelectTrigger className="w-[140px] h-10">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Sources</SelectItem>
              {Object.values(ORDER_SOURCE).map((s) => (
                <SelectItem key={s} value={s}>{ORDER_SOURCE_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status ?? ALL}
            onValueChange={(v) => setFilter('status', v as OrderStatus | 'all')}
          >
            <SelectTrigger className="w-[140px] h-10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Statuses</SelectItem>
              {Object.values(ORDER_STATUS).map((s) => (
                <SelectItem key={s} value={s}>{ORDER_STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.paymentMethod ?? ALL}
            onValueChange={(v) => setFilter('paymentMethod', v as PaymentMethod | 'all')}
          >
            <SelectTrigger className="w-[140px] h-10">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Payments</SelectItem>
              {Object.values(PAYMENT_METHOD).map((p) => (
                <SelectItem key={p} value={p}>{PAYMENT_METHOD_LABELS[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={(e) => setFilter('dateFrom', e.target.value || undefined)}
            className="w-[150px] h-10"
            placeholder="From"
          />
          <Input
            type="date"
            value={filters.dateTo ?? ''}
            onChange={(e) => setFilter('dateTo', e.target.value || undefined)}
            className="w-[150px] h-10"
            placeholder="To"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive py-8 text-center">Failed to load orders</p>
      ) : (
        <div className="rounded-lg border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!orders || orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const itemCount = order.order_items?.[0]?.count ?? 0
                  return (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <TableCell className="font-mono text-xs">
                        {order.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          ORDER_SOURCE_COLORS[order.source as OrderSource],
                        )}>
                          {ORDER_SOURCE_LABELS[order.source as OrderSource]}
                        </span>
                      </TableCell>
                      <TableCell>{order.customer_name || '—'}</TableCell>
                      <TableCell className="text-right">{itemCount}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(order.total_amount)}
                      </TableCell>
                      <TableCell className="capitalize">
                        {order.payment_method
                          ? PAYMENT_METHOD_LABELS[order.payment_method as PaymentMethod]
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ORDER_STATUS_VARIANT[order.status as OrderStatus]}>
                          {ORDER_STATUS_LABELS[order.status as OrderStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {format(new Date(order.created_at), 'dd MMM, HH:mm')}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <OrderDetailDialog
        orderId={selectedOrderId}
        open={!!selectedOrderId}
        onOpenChange={(open) => { if (!open) setSelectedOrderId(null) }}
      />
    </div>
  )
}
