'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Printer, Pencil, X, CheckCircle2, PlayCircle, UserX } from 'lucide-react'
import {
  useBooking,
  useUpdateBookingStatus,
  useRecordBookingPayment,
} from '@/hooks/useBookings'
import { formatCurrency, cn, toSLDateString, startOfTodaySL } from '@/lib/utils'
import {
  BOOKING_STATUS,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_COLORS,
  BOOKING_SOURCE_LABELS,
  BOOKING_PAYMENT_METHOD,
  BOOKING_PAYMENT_METHOD_LABELS,
  BOOKING_PAYMENT_TYPE,
  BOOKING_PAYMENT_TYPE_LABELS,
  type BookingStatus,
  type BookingSource,
  type BookingPaymentMethod,
  type BookingPaymentType,
} from '@/constants/bookings'
import { format, parse } from 'date-fns'
import { ROLES, type Role } from '@/constants/roles'
import { BookingFormDialog } from './booking-form-dialog'
import { CancelBookingDialog } from './cancel-booking-dialog'
import { getBookingReceiptHtml, getBookingPrintTitle, BOOKING_RECEIPT_STYLES } from './booking-receipt'
import { toast } from 'sonner'
import { validatePositiveNumber } from '@/lib/validation'

interface BookingDetailDialogProps {
  bookingId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  userRole?: Role
}

function trimSeconds(t: string): string {
  return t.length >= 5 ? t.slice(0, 5) : t
}

export function BookingDetailDialog({
  bookingId,
  open,
  onOpenChange,
  userRole,
}: BookingDetailDialogProps) {
  const { data: booking, isLoading } = useBooking(bookingId)
  const updateStatus = useUpdateBookingStatus()
  const recordPayment = useRecordBookingPayment()

  const [editOpen, setEditOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState<BookingPaymentMethod>(BOOKING_PAYMENT_METHOD.CASH)
  const [payType, setPayType] = useState<BookingPaymentType>(BOOKING_PAYMENT_TYPE.BALANCE)
  const [payReference, setPayReference] = useState('')

  const canEdit = userRole === ROLES.OWNER || userRole === ROLES.MANAGER
  const canPrint = canEdit || userRole === ROLES.CASHIER

  function handlePrintReceipt() {
    if (!booking) return
    const html = getBookingReceiptHtml(booking)
    const title = getBookingPrintTitle(booking)
    const w = window.open('', '_blank', 'width=400,height=700')
    if (!w) {
      toast.error('Popup blocked. Please allow popups for this site and try again.')
      return
    }
    w.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8" /><title>${title}</title>
<style>${BOOKING_RECEIPT_STYLES}</style></head>
<body>${html}
<script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };</script>
</body></html>`)
    w.document.close()
  }

  function handleStatusChange(status: BookingStatus) {
    if (!booking) return
    updateStatus.mutate({ id: booking.id, status })
  }

  function handleRecordPayment() {
    if (!booking) return
    const amt = Math.round(parseFloat(payAmount || '0') * 100)
    const err = validatePositiveNumber(amt / 100, 'Amount')
    if (err) { toast.error(err); return }
    recordPayment.mutate(
      {
        bookingId: booking.id,
        amount: amt,
        method: payMethod,
        type: payType,
        reference: payReference.trim() || null,
      },
      {
        onSuccess: () => {
          setShowPaymentForm(false)
          setPayAmount('')
          setPayReference('')
        },
      },
    )
  }

  if (!booking && !isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Booking</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-4">Booking not found.</p>
        </DialogContent>
      </Dialog>
    )
  }

  const today = toSLDateString(startOfTodaySL())
  const isToday = booking?.booking_date === today
  const status = booking?.status as BookingStatus | undefined

  // Status workflow buttons (owner/manager only):
  const showInProgress = canEdit && isToday && status === BOOKING_STATUS.CONFIRMED
  const showComplete   = canEdit && (status === BOOKING_STATUS.IN_PROGRESS || (isToday && status === BOOKING_STATUS.CONFIRMED))
  const showNoShow     = canEdit && (status === BOOKING_STATUS.CONFIRMED || status === BOOKING_STATUS.TENTATIVE)
  const showCancel     = canEdit && status !== BOOKING_STATUS.COMPLETED && status !== BOOKING_STATUS.CANCELLED

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl w-[96vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>

          {isLoading || !booking ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-5 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-mono text-xl font-semibold">{booking.booking_code}</p>
                  {booking.occasion && (
                    <p className="text-sm text-muted-foreground mt-0.5">{booking.occasion}</p>
                  )}
                </div>
                <span className={cn(
                  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
                  BOOKING_STATUS_COLORS[booking.status as BookingStatus],
                )}>
                  {BOOKING_STATUS_LABELS[booking.status as BookingStatus]}
                </span>
              </div>

              {/* Customer + booking info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-3 space-y-2 text-sm">
                  <p className="text-xs uppercase font-semibold text-muted-foreground">Customer</p>
                  <p className="font-medium">{booking.customer_name}</p>
                  <p>
                    <a href={`tel:${booking.customer_phone}`} className="text-primary hover:underline">
                      {booking.customer_phone}
                    </a>
                  </p>
                  {booking.customer_email && (
                    <p>
                      <a href={`mailto:${booking.customer_email}`} className="text-primary hover:underline break-all">
                        {booking.customer_email}
                      </a>
                    </p>
                  )}
                </div>

                <div className="rounded-lg border p-3 space-y-1.5 text-sm">
                  <p className="text-xs uppercase font-semibold text-muted-foreground">Event</p>
                  <p className="font-medium">
                    {format(new Date(booking.booking_date + 'T00:00:00'), 'dd MMM yyyy (EEE)')}
                  </p>
                  <p>
                    {format(parse(trimSeconds(booking.start_time), 'HH:mm', new Date()), 'h:mm a')}
                    {' – '}
                    {format(parse(trimSeconds(booking.end_time), 'HH:mm', new Date()), 'h:mm a')}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Party of {booking.party_size}
                    {booking.table_or_area && ` · ${booking.table_or_area}`}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Source: {BOOKING_SOURCE_LABELS[booking.source as BookingSource]}
                  </p>
                </div>
              </div>

              {/* Special notes */}
              {booking.special_notes && (
                <div className="rounded-lg border bg-amber-50 dark:bg-amber-900/10 p-3 text-sm">
                  <p className="text-xs uppercase font-semibold text-amber-900 dark:text-amber-200 mb-1">
                    Special Notes
                  </p>
                  <p className="whitespace-pre-wrap text-amber-900 dark:text-amber-100">
                    {booking.special_notes}
                  </p>
                </div>
              )}

              {/* Items */}
              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {booking.booking_items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.menu_items?.name ?? 'Unknown'}
                          {item.notes && (
                            <p className="text-xs text-muted-foreground italic mt-0.5">
                              {item.notes}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {formatCurrency(item.unit_price)}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {formatCurrency(item.unit_price * item.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pricing summary */}
              <div className="space-y-1.5 text-sm border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Food subtotal</span>
                  <span>{formatCurrency(booking.subtotal)}</span>
                </div>
                {booking.booking_fee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Booking fee</span>
                    <span>{formatCurrency(booking.booking_fee)}</span>
                  </div>
                )}
                {booking.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-destructive">-{formatCurrency(booking.discount)}</span>
                  </div>
                )}
                {booking.service_charge > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service charge</span>
                    <span>{formatCurrency(booking.service_charge)}</span>
                  </div>
                )}
                {booking.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(booking.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold pt-1.5 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(booking.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid</span>
                  <span>{formatCurrency(booking.deposit_paid)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Balance Due</span>
                  <span className={booking.balance_due > 0 ? 'text-destructive' : 'text-emerald-700'}>
                    {booking.balance_due > 0
                      ? formatCurrency(booking.balance_due)
                      : booking.balance_due < 0
                        ? `Paid in full · ${formatCurrency(-booking.balance_due)} change due`
                        : 'Paid in full'}
                  </span>
                </div>
              </div>

              {/* Payments section */}
              <div className="rounded-lg border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Payments</p>
                  {canEdit && !showPaymentForm && (
                    <Button size="sm" variant="outline" onClick={() => setShowPaymentForm(true)}>
                      Record Payment
                    </Button>
                  )}
                </div>

                {booking.booking_payments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No payments recorded yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {booking.booking_payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs gap-2 border-b last:border-b-0 pb-1.5 last:pb-0">
                        <span className="text-muted-foreground">
                          {format(new Date(p.created_at), 'dd MMM yyyy h:mm a')}
                        </span>
                        <Badge variant={p.type === 'refund' ? 'destructive' : 'secondary'}>
                          {BOOKING_PAYMENT_TYPE_LABELS[p.type]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {BOOKING_PAYMENT_METHOD_LABELS[p.method as BookingPaymentMethod] ?? p.method}
                        </span>
                        {p.reference && (
                          <span className="text-xs font-mono text-muted-foreground">
                            #{p.reference}
                          </span>
                        )}
                        <span className="font-semibold ml-auto">
                          {p.type === 'refund' ? '-' : ''}{formatCurrency(p.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {showPaymentForm && (
                  <div className="space-y-2 rounded-md border p-3 bg-muted/30">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <Select value={payType} onValueChange={(v) => setPayType(v as BookingPaymentType)}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.values(BOOKING_PAYMENT_TYPE).map((t) => (
                              <SelectItem key={t} value={t}>{BOOKING_PAYMENT_TYPE_LABELS[t]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Method</Label>
                        <Select value={payMethod} onValueChange={(v) => setPayMethod(v as BookingPaymentMethod)}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.values(BOOKING_PAYMENT_METHOD).map((m) => (
                              <SelectItem key={m} value={m}>{BOOKING_PAYMENT_METHOD_LABELS[m]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Amount (LKR)</Label>
                        <Input
                          type="number" step="0.01" min="0"
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Reference</Label>
                        <Input
                          value={payReference}
                          onChange={(e) => setPayReference(e.target.value)}
                          maxLength={60}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={handleRecordPayment} disabled={recordPayment.isPending}>
                        {recordPayment.isPending ? 'Saving...' : 'Save Payment'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowPaymentForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cancellation info if cancelled */}
              {booking.status === BOOKING_STATUS.CANCELLED && booking.cancellation_reason && (
                <div className="rounded-lg border bg-destructive/5 p-3 text-sm">
                  <p className="text-xs uppercase font-semibold text-destructive mb-1">
                    Cancellation Reason
                  </p>
                  <p className="text-foreground">{booking.cancellation_reason}</p>
                  {booking.cancelled_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Cancelled {format(new Date(booking.cancelled_at), 'dd MMM yyyy h:mm a')}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {canPrint && (
                  <Button variant="outline" className="h-11" onClick={handlePrintReceipt}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Receipt
                  </Button>
                )}
                {canEdit && booking.status !== BOOKING_STATUS.CANCELLED && booking.status !== BOOKING_STATUS.COMPLETED && (
                  <Button variant="outline" className="h-11" onClick={() => setEditOpen(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                {showInProgress && (
                  <Button variant="outline" className="h-11" onClick={() => handleStatusChange(BOOKING_STATUS.IN_PROGRESS)}>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Mark In Progress
                  </Button>
                )}
                {showComplete && (
                  <Button className="h-11" onClick={() => handleStatusChange(BOOKING_STATUS.COMPLETED)}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark Completed
                  </Button>
                )}
                {showNoShow && (
                  <Button variant="outline" className="h-11" onClick={() => handleStatusChange(BOOKING_STATUS.NO_SHOW)}>
                    <UserX className="h-4 w-4 mr-2" />
                    No Show
                  </Button>
                )}
                {showCancel && (
                  <Button variant="destructive" className="h-11 ml-auto" onClick={() => setCancelOpen(true)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {booking && (
        <>
          <BookingFormDialog
            booking={booking}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
          <CancelBookingDialog
            booking={booking}
            open={cancelOpen}
            onOpenChange={setCancelOpen}
          />
        </>
      )}
    </>
  )
}
