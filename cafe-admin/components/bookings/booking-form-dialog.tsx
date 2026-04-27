'use client'

import { useState, useMemo, useEffect } from 'react'
import { Plus, Minus, Trash2, AlertTriangle } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMenuItems } from '@/hooks/useOrders'
import {
  useCreateBooking,
  useUpdateBooking,
  useCheckBookingConflicts,
  type BookingDetail,
} from '@/hooks/useBookings'
import { formatCurrency } from '@/lib/utils'
import { validatePositiveNumber, validateStringLength } from '@/lib/validation'
import { toast } from 'sonner'
import {
  BOOKING_SOURCE,
  BOOKING_SOURCE_LABELS,
  BOOKING_PAYMENT_METHOD,
  BOOKING_PAYMENT_METHOD_LABELS,
  BOOKING_OCCASIONS,
  BOOKING_MAX_MONTHS_AHEAD,
  SL_PHONE_REGEX,
  EMAIL_REGEX,
  type BookingSource,
  type BookingPaymentMethod,
} from '@/constants/bookings'
import { format, addMonths, parse } from 'date-fns'
import type { MenuItem } from '@/lib/types'

interface LineItem {
  menu_item_id: string
  name: string
  quantity: number
  unit_price: number  // cents
  notes: string
}

interface BookingFormDialogProps {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  booking?: BookingDetail | null  // edit mode if provided
}

const todayStr = () => format(new Date(), 'yyyy-MM-dd')
const maxBookingDateStr = () => format(addMonths(new Date(), BOOKING_MAX_MONTHS_AHEAD), 'yyyy-MM-dd')

function trimSeconds(t: string): string {
  // Accepts "HH:mm" or "HH:mm:ss" — returns "HH:mm"
  return t.length >= 5 ? t.slice(0, 5) : t
}

export function BookingFormDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
  booking,
}: BookingFormDialogProps) {
  const isEdit = !!booking
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const { data: menuItems } = useMenuItems()
  const createBooking = useCreateBooking()
  const updateBooking = useUpdateBooking()

  const [customerName, setCustomerName]   = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [source, setSource]               = useState<BookingSource>(BOOKING_SOURCE.WALK_IN)

  const [bookingDate, setBookingDate] = useState(todayStr())
  const [startTime, setStartTime]     = useState('18:00')
  const [endTime, setEndTime]         = useState('20:00')
  const [partySize, setPartySize]     = useState('4')
  const [occasionPreset, setOccasionPreset] = useState<string>('')
  const [occasionCustom, setOccasionCustom] = useState('')
  const [tableArea, setTableArea]     = useState('')
  const [specialNotes, setSpecialNotes] = useState('')

  const [lines, setLines] = useState<LineItem[]>([])

  const [bookingFee, setBookingFee]       = useState('0')
  const [discount, setDiscount]           = useState('0')
  const [serviceCharge, setServiceCharge] = useState('0')
  const [tax, setTax]                     = useState('0')

  const [depositAmount, setDepositAmount]       = useState('0')
  const [depositMethod, setDepositMethod]       = useState<BookingPaymentMethod>(BOOKING_PAYMENT_METHOD.CASH)
  const [depositReference, setDepositReference] = useState('')

  // Initialise from booking on edit
  useEffect(() => {
    if (!booking || !open) return
    setCustomerName(booking.customer_name)
    setCustomerPhone(booking.customer_phone)
    setCustomerEmail(booking.customer_email ?? '')
    setSource(booking.source)
    setBookingDate(booking.booking_date)
    setStartTime(trimSeconds(booking.start_time))
    setEndTime(trimSeconds(booking.end_time))
    setPartySize(String(booking.party_size))
    const presetMatch = booking.occasion && BOOKING_OCCASIONS.includes(booking.occasion as typeof BOOKING_OCCASIONS[number])
    if (presetMatch) {
      setOccasionPreset(booking.occasion!)
      setOccasionCustom('')
    } else {
      setOccasionPreset(booking.occasion ? 'Other' : '')
      setOccasionCustom(booking.occasion ?? '')
    }
    setTableArea(booking.table_or_area ?? '')
    setSpecialNotes(booking.special_notes ?? '')
    setBookingFee((booking.booking_fee / 100).toFixed(2))
    setDiscount((booking.discount / 100).toFixed(2))
    setServiceCharge((booking.service_charge / 100).toFixed(2))
    setTax((booking.tax / 100).toFixed(2))
    setLines(
      booking.booking_items.map((bi) => ({
        menu_item_id: bi.menu_item_id,
        name: bi.menu_items?.name ?? 'Item',
        quantity: bi.quantity,
        unit_price: bi.unit_price,
        notes: bi.notes ?? '',
      })),
    )
    // Deposit not editable on edit; existing deposit_paid stays
    setDepositAmount('0')
    setDepositMethod(BOOKING_PAYMENT_METHOD.CASH)
    setDepositReference('')
  }, [booking, open])

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.unit_price * l.quantity, 0),
    [lines],
  )

  const bookingFeeCents     = Math.round(parseFloat(bookingFee || '0') * 100) || 0
  const discountCents       = Math.round(parseFloat(discount || '0') * 100) || 0
  const serviceChargeCents  = Math.round(parseFloat(serviceCharge || '0') * 100) || 0
  const taxCents            = Math.round(parseFloat(tax || '0') * 100) || 0
  const total               = Math.max(0, subtotal + bookingFeeCents + serviceChargeCents + taxCents - discountCents)
  const depositCentsLive    = Math.round(parseFloat(depositAmount || '0') * 100) || 0
  const overpayCents        = Math.max(0, depositCentsLive - total)
  const balancePreview      = Math.max(0, total - depositCentsLive)

  // Suggest 30% deposit and 10% service charge for parties > 6
  useEffect(() => {
    if (isEdit) return
    const ps = parseInt(partySize) || 0
    if (ps > 6 && serviceCharge === '0') {
      setServiceCharge(((subtotal * 0.10) / 100).toFixed(2))
    }
  }, [partySize, subtotal, serviceCharge, isEdit])

  useEffect(() => {
    if (isEdit) return
    if (depositAmount === '0' && total > 0) {
      // Only auto-fill once when total appears
      setDepositAmount((Math.round(total * 0.3) / 100).toFixed(2))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total > 0])

  const conflictsQuery = useCheckBookingConflicts(
    bookingDate || null,
    startTime || null,
    endTime || null,
    booking?.id ?? null,
  )

  const groupedItems = useMemo(() => {
    if (!menuItems) return new Map<string, MenuItem[]>()
    const map = new Map<string, MenuItem[]>()
    for (const item of menuItems) {
      const list = map.get(item.category) ?? []
      list.push(item)
      map.set(item.category, list)
    }
    return map
  }, [menuItems])

  const availableIds = useMemo(
    () => new Set((menuItems ?? []).map((m) => m.id)),
    [menuItems],
  )

  function addItem(item: MenuItem) {
    setLines((prev) => {
      const existing = prev.find((l) => l.menu_item_id === item.id)
      if (existing) {
        return prev.map((l) =>
          l.menu_item_id === item.id ? { ...l, quantity: l.quantity + 1 } : l,
        )
      }
      return [...prev, {
        menu_item_id: item.id,
        name: item.name,
        quantity: 1,
        unit_price: item.price,
        notes: '',
      }]
    })
  }

  function updateQty(menuItemId: string, delta: number) {
    setLines((prev) =>
      prev
        .map((l) => l.menu_item_id === menuItemId
          ? { ...l, quantity: l.quantity + delta }
          : l)
        .filter((l) => l.quantity > 0),
    )
  }

  function updateUnitPrice(menuItemId: string, value: string) {
    const cents = Math.max(0, Math.round(parseFloat(value || '0') * 100))
    setLines((prev) => prev.map((l) =>
      l.menu_item_id === menuItemId ? { ...l, unit_price: cents } : l,
    ))
  }

  function updateLineNotes(menuItemId: string, notes: string) {
    setLines((prev) => prev.map((l) =>
      l.menu_item_id === menuItemId ? { ...l, notes } : l,
    ))
  }

  function removeLine(menuItemId: string) {
    setLines((prev) => prev.filter((l) => l.menu_item_id !== menuItemId))
  }

  function resetForm() {
    setCustomerName('')
    setCustomerPhone('')
    setCustomerEmail('')
    setSource(BOOKING_SOURCE.WALK_IN)
    setBookingDate(todayStr())
    setStartTime('18:00')
    setEndTime('20:00')
    setPartySize('4')
    setOccasionPreset('')
    setOccasionCustom('')
    setTableArea('')
    setSpecialNotes('')
    setLines([])
    setBookingFee('0')
    setDiscount('0')
    setServiceCharge('0')
    setTax('0')
    setDepositAmount('0')
    setDepositMethod(BOOKING_PAYMENT_METHOD.CASH)
    setDepositReference('')
  }

  function getOccasion(): string | null {
    if (!occasionPreset) return null
    if (occasionPreset === 'Other') return occasionCustom.trim() || null
    return occasionPreset
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validation
    const nameErr = validateStringLength(customerName, 'Customer name', 80, { required: true })
    if (nameErr) { toast.error(nameErr); return }

    if (!SL_PHONE_REGEX.test(customerPhone.trim())) {
      toast.error('Phone must be 0XXXXXXXXX or +94XXXXXXXXX')
      return
    }
    if (customerEmail.trim() && !EMAIL_REGEX.test(customerEmail.trim())) {
      toast.error('Invalid email format')
      return
    }
    if (!bookingDate) { toast.error('Booking date is required'); return }
    if (!isEdit && bookingDate < todayStr()) {
      toast.error('Booking date cannot be in the past')
      return
    }
    if (bookingDate > maxBookingDateStr()) {
      toast.error(`Booking date cannot be more than ${BOOKING_MAX_MONTHS_AHEAD} months ahead`)
      return
    }
    if (endTime <= startTime) {
      toast.error('End time must be after start time')
      return
    }
    const partySizeNum = parseInt(partySize)
    if (isNaN(partySizeNum) || partySizeNum < 1 || partySizeNum > 100) {
      toast.error('Party size must be between 1 and 100')
      return
    }
    const notesErr = validateStringLength(specialNotes, 'Special notes', 500)
    if (notesErr) { toast.error(notesErr); return }

    for (const v of [
      ['Booking fee', bookingFee],
      ['Discount', discount],
      ['Service charge', serviceCharge],
      ['Tax', tax],
      ['Deposit', depositAmount],
    ] as const) {
      const err = validatePositiveNumber(v[1] || '0', v[0], { allowZero: true })
      if (err) { toast.error(err); return }
    }
    if (lines.length === 0) {
      toast.error('Add at least one menu item')
      return
    }

    const itemsPayload = lines.map((l) => ({
      menu_item_id: l.menu_item_id,
      quantity: l.quantity,
      unit_price: l.unit_price,
      notes: l.notes.trim() || null,
    }))

    if (isEdit && booking) {
      updateBooking.mutate(
        {
          id: booking.id,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_email: customerEmail.trim() || null,
          party_size: partySizeNum,
          occasion: getOccasion(),
          booking_date: bookingDate,
          start_time: startTime,
          end_time: endTime,
          table_or_area: tableArea.trim() || null,
          special_notes: specialNotes.trim() || null,
          booking_fee: bookingFeeCents,
          discount: discountCents,
          service_charge: serviceChargeCents,
          tax: taxCents,
          source,
          items: itemsPayload,
        },
        {
          onSuccess: () => setOpen(false),
        },
      )
    } else {
      const depositCents = Math.round(parseFloat(depositAmount || '0') * 100)
      createBooking.mutate(
        {
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_email: customerEmail.trim() || null,
          party_size: partySizeNum,
          occasion: getOccasion(),
          booking_date: bookingDate,
          start_time: startTime,
          end_time: endTime,
          table_or_area: tableArea.trim() || null,
          special_notes: specialNotes.trim() || null,
          booking_fee: bookingFeeCents,
          discount: discountCents,
          service_charge: serviceChargeCents,
          tax: taxCents,
          deposit_paid: depositCents,
          deposit_method: depositCents > 0 ? depositMethod : null,
          deposit_reference: depositReference.trim() || null,
          source,
          items: itemsPayload,
        },
        {
          onSuccess: () => {
            resetForm()
            setOpen(false)
          },
        },
      )
    }
  }

  const isPending = createBooking.isPending || updateBooking.isPending
  const conflicts = (conflictsQuery.data ?? []).filter((c) => c.id !== booking?.id)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-4xl w-[96vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit Booking ${booking?.booking_code}` : 'New Booking'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: Customer details */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Customer</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  maxLength={80}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone *</Label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="07XXXXXXXX or +947XXXXXXXX"
                  maxLength={15}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  maxLength={100}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Select value={source} onValueChange={(v) => setSource(v as BookingSource)}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(BOOKING_SOURCE).map((s) => (
                      <SelectItem key={s} value={s}>{BOOKING_SOURCE_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* SECTION 2: Booking details */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Booking</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={bookingDate}
                  min={isEdit ? undefined : todayStr()}
                  max={maxBookingDateStr()}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Party Size *</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={partySize}
                  onChange={(e) => setPartySize(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Start Time *</Label>
                <Input
                  type="time"
                  step={900}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>End Time *</Label>
                <Input
                  type="time"
                  step={900}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Occasion</Label>
                <Select value={occasionPreset} onValueChange={setOccasionPreset}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select occasion..." /></SelectTrigger>
                  <SelectContent>
                    {BOOKING_OCCASIONS.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {occasionPreset === 'Other' && (
                  <Input
                    value={occasionCustom}
                    onChange={(e) => setOccasionCustom(e.target.value)}
                    placeholder="Specify occasion"
                    maxLength={50}
                    className="h-11 mt-2"
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Table / Area</Label>
                <Input
                  value={tableArea}
                  onChange={(e) => setTableArea(e.target.value)}
                  placeholder="e.g. Main floor, Outdoor 3-4"
                  maxLength={60}
                  className="h-11"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Special Notes</Label>
              <Textarea
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="Allergies, dietary requirements, decoration requests, etc."
                maxLength={500}
                rows={3}
              />
              <p className="text-[11px] text-muted-foreground text-right">
                {specialNotes.length}/500
              </p>
            </div>
          </section>

          {/* SECTION 3: Conflicts */}
          {conflicts.length > 0 && (
            <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-900/10 p-3 text-xs">
              <p className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                {conflicts.length} other booking{conflicts.length === 1 ? '' : 's'} overlap this time
              </p>
              <ul className="mt-1.5 space-y-0.5 text-amber-900/90 dark:text-amber-200/90">
                {conflicts.map((c) => {
                  const st = parse(trimSeconds(c.start_time), 'HH:mm', new Date())
                  const et = parse(trimSeconds(c.end_time), 'HH:mm', new Date())
                  return (
                    <li key={c.id}>
                      <span className="font-mono">{c.booking_code}</span>{' '}
                      ({c.customer_name}, {c.party_size} ppl, {format(st, 'h:mm a')}–{format(et, 'h:mm a')})
                    </li>
                  )
                })}
              </ul>
              <p className="mt-1.5 text-amber-900/80 dark:text-amber-200/80">
                You can still proceed if capacity allows.
              </p>
            </div>
          )}

          {/* SECTION 4: Pre-ordered items */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Pre-ordered items</h3>
            <div className="rounded-lg border max-h-56 overflow-y-auto">
              {Array.from(groupedItems.entries()).map(([category, items]) => (
                <div key={category}>
                  <div className="sticky top-0 bg-muted/80 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b">
                    {category}
                  </div>
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                      onClick={() => addItem(item)}
                    >
                      <span>{item.name}</span>
                      <span className="text-muted-foreground ml-2 shrink-0">{formatCurrency(item.price)}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {lines.length > 0 && (
              <div className="space-y-2 rounded-lg border p-3">
                {lines.map((line) => {
                  const unavailable = menuItems !== undefined && !availableIds.has(line.menu_item_id)
                  return (
                    <div key={line.menu_item_id} className="space-y-1.5 border-b pb-2 last:border-b-0 last:pb-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="flex-1 truncate flex items-center gap-1.5">
                          {unavailable && (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          )}
                          {line.name}
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={(line.unit_price / 100).toFixed(2)}
                          onChange={(e) => updateUnitPrice(line.menu_item_id, e.target.value)}
                          className="w-20 h-8 text-right text-xs"
                        />
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
                      <Input
                        value={line.notes}
                        onChange={(e) => updateLineNotes(line.menu_item_id, e.target.value)}
                        placeholder="Item notes (e.g. no nuts, extra cheese)"
                        maxLength={120}
                        className="h-8 text-xs"
                      />
                    </div>
                  )
                })}
                <div className="flex justify-between pt-2 border-t font-semibold text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
              </div>
            )}
          </section>

          {/* SECTION 5: Pricing */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Pricing</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label>Booking Fee (LKR)</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={bookingFee}
                  onChange={(e) => setBookingFee(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Discount (LKR)</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Service Charge (LKR)</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={serviceCharge}
                  onChange={(e) => setServiceCharge(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tax (LKR)</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
            <div className="space-y-1 text-sm border-t pt-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Food subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {bookingFeeCents > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Booking fee</span>
                  <span>{formatCurrency(bookingFeeCents)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-1">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </section>

          {/* SECTION 6: Deposit (create only) */}
          {!isEdit && (
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Deposit</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Amount (LKR)</Label>
                  <Input
                    type="number" step="0.01" min="0"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Method</Label>
                  <Select value={depositMethod} onValueChange={(v) => setDepositMethod(v as BookingPaymentMethod)}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.values(BOOKING_PAYMENT_METHOD).map((m) => (
                        <SelectItem key={m} value={m}>{BOOKING_PAYMENT_METHOD_LABELS[m]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Reference</Label>
                  <Input
                    value={depositReference}
                    onChange={(e) => setDepositReference(e.target.value)}
                    placeholder="Optional"
                    maxLength={60}
                    className="h-11"
                  />
                </div>
              </div>
              {total > 0 && depositCentsLive > 0 && (
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs space-y-0.5">
                  {overpayCents > 0 ? (
                    <>
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Paid in full</span>
                        <span>+{formatCurrency(overpayCents)} change due to customer</span>
                      </div>
                    </>
                  ) : balancePreview === 0 ? (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Paid in full</span>
                      <span>—</span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Balance due after deposit</span>
                      <span className="font-medium text-destructive">{formatCurrency(balancePreview)}</span>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          <Button type="submit" className="w-full h-11" disabled={isPending}>
            {isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Booking'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
