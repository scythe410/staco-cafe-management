'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Printer, Archive, RotateCcw } from 'lucide-react'
import { useOrderDetail, useUpdateOrderStatus } from '@/hooks/useOrders'
import { useArchiveRecord, useUnarchiveRecord } from '@/hooks/useArchive'
import { formatCurrency } from '@/lib/utils'
import {
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VARIANT,
  ORDER_SOURCE_LABELS,
  ORDER_SOURCE_COLORS,
  COMMISSION_SOURCES,
  NEXT_STATUS,
  NEXT_STATUS_LABEL,
  PAYMENT_METHOD_LABELS,
  type OrderStatus,
  type OrderSource,
  type PaymentMethod,
} from '@/constants/orders'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { MENU_CATEGORY_LABELS, CATEGORY_BADGE_STYLES } from '@/constants/menu'
import { ROLES, type Role } from '@/constants/roles'
import { getBillHtml, getOrderPrintTitle, BILL_STYLES } from './order-bill'
import { toast } from 'sonner'

interface OrderDetailDialogProps {
  orderId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  readOnly?: boolean
  userRole?: Role
}

export function OrderDetailDialog({ orderId, open, onOpenChange, readOnly = false, userRole }: OrderDetailDialogProps) {
  const { data: order, isLoading } = useOrderDetail(orderId)
  const updateStatus = useUpdateOrderStatus()
  const archiveRecord = useArchiveRecord()
  const unarchiveRecord = useUnarchiveRecord()

  function handleAdvance() {
    if (!order) return
    const next = NEXT_STATUS[order.status as OrderStatus]
    if (!next) return
    updateStatus.mutate({ id: order.id, status: next })
  }

  function handleCancel() {
    if (!order) return
    updateStatus.mutate(
      { id: order.id, status: ORDER_STATUS.CANCELLED },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  function handlePrintBill() {
    if (!order) return

    const billContent = getBillHtml(order)
    const title = getOrderPrintTitle(order)

    const printWindow = window.open('', '_blank', 'width=400,height=700')
    if (!printWindow) {
      toast.error('Popup blocked. Please allow popups for this site and try again.')
      return
    }

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>${BILL_STYLES}</style>
</head>
<body>
  ${billContent}
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>`)
    printWindow.document.close()
  }

  const canPrint = userRole === ROLES.OWNER || userRole === ROLES.MANAGER || userRole === ROLES.CASHIER
  const canArchive = userRole === ROLES.OWNER || userRole === ROLES.MANAGER
  const canRestore = userRole === ROLES.OWNER

  const hasCommission = order && COMMISSION_SOURCES.includes(order.source as OrderSource)
  const nextLabel = order ? NEXT_STATUS_LABEL[order.status as OrderStatus] : null
  const isFinal = order && (
    order.status === ORDER_STATUS.COMPLETED ||
    order.status === ORDER_STATUS.CANCELLED ||
    order.status === ORDER_STATUS.REFUNDED
  )

  function handleArchive() {
    if (!order) return
    archiveRecord.mutate(
      { table: 'orders', id: order.id },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  function handleRestore() {
    if (!order) return
    unarchiveRecord.mutate(
      { table: 'orders', id: order.id },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl w-[96vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
        </DialogHeader>

        {isLoading || !order ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-5 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header info */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Order ID</span>
                <p className="font-mono text-xs mt-0.5 truncate">{order.id.slice(0, 8)}...</p>
              </div>
              <div>
                <span className="text-muted-foreground">Customer</span>
                <p className="mt-0.5">{order.customer_name || '—'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Source</span>
                <p className="mt-1">
                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap', ORDER_SOURCE_COLORS[order.source as OrderSource])}>
                    {ORDER_SOURCE_LABELS[order.source as OrderSource]}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Status</span>
                <p className="mt-1">
                  <Badge variant={ORDER_STATUS_VARIANT[order.status as OrderStatus]}>
                    {ORDER_STATUS_LABELS[order.status as OrderStatus]}
                  </Badge>
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Payment</span>
                <p className="mt-0.5 whitespace-nowrap">
                  {order.payment_method
                    ? PAYMENT_METHOD_LABELS[order.payment_method as PaymentMethod]
                    : '—'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Date</span>
                <p className="mt-0.5">{format(new Date(order.created_at), 'dd MMM yyyy, HH:mm')}</p>
              </div>
            </div>

            {/* Order items */}
            <div className="rounded-lg border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.order_items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="break-words">{item.menu_items?.name ?? 'Unknown item'}</span>
                          {item.menu_items?.category && (
                            <span className={cn(
                              'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium shrink-0',
                              CATEGORY_BADGE_STYLES[item.menu_items.category] ?? 'bg-muted text-muted-foreground',
                            )}>
                              {MENU_CATEGORY_LABELS[item.menu_items.category] ?? item.menu_items.category}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {formatCurrency(item.unit_price * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            <div className="space-y-1.5 text-sm border-t pt-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-destructive">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
              )}
              {hasCommission && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Commission ({ORDER_SOURCE_LABELS[order.source as OrderSource]})</span>
                  <span className="text-destructive">-{formatCurrency(order.commission)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-1.5 border-t">
                <span>{hasCommission ? 'Net Amount' : 'Total'}</span>
                <span>
                  {formatCurrency(
                    order.total_amount - order.discount + order.tax - (hasCommission ? order.commission : 0)
                  )}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 flex-wrap">
              {!isFinal && !readOnly && !order.is_archived && (
                <>
                  {nextLabel && (
                    <Button
                      className="flex-1 h-11"
                      onClick={handleAdvance}
                      disabled={updateStatus.isPending}
                    >
                      {updateStatus.isPending ? 'Updating...' : nextLabel}
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    className="h-11"
                    onClick={handleCancel}
                    disabled={updateStatus.isPending}
                  >
                    Cancel Order
                  </Button>
                </>
              )}
              {canPrint && (
                <Button
                  variant="outline"
                  className="h-11"
                  onClick={handlePrintBill}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Bill
                </Button>
              )}
              {!order.is_archived && isFinal && canArchive && (
                <Button
                  variant="outline"
                  className="h-11"
                  onClick={handleArchive}
                  disabled={archiveRecord.isPending}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
              )}
              {order.is_archived && canRestore && (
                <Button
                  variant="outline"
                  className="h-11"
                  onClick={handleRestore}
                  disabled={unarchiveRecord.isPending}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
