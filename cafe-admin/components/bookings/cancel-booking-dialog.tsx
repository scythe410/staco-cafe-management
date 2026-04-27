'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCancelBooking, type BookingDetail } from '@/hooks/useBookings'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

interface CancelBookingDialogProps {
  booking: BookingDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CancelBookingDialog({ booking, open, onOpenChange }: CancelBookingDialogProps) {
  const cancel = useCancelBooking()
  const [reason, setReason] = useState('')
  const [refundDeposit, setRefundDeposit] = useState(false)

  useEffect(() => {
    if (open) {
      setReason('')
      setRefundDeposit(false)
    }
  }, [open])

  if (!booking) return null

  const hasDeposit = booking.deposit_paid > 0

  function handleConfirm() {
    if (!reason.trim()) {
      toast.error('Cancellation reason is required')
      return
    }
    cancel.mutate(
      {
        id: booking!.id,
        reason: reason.trim(),
        refundDeposit: refundDeposit && hasDeposit,
        depositAmount: booking!.deposit_paid,
        depositMethod: booking!.deposit_method,
      },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Booking {booking.booking_code}?</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            This will mark the booking as cancelled. Past records remain visible
            for reporting.
          </p>

          <div className="space-y-1.5">
            <Label>Cancellation Reason *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder="Explain why this booking is being cancelled..."
              required
            />
          </div>

          {hasDeposit && (
            <label className="flex items-start gap-2 rounded-md border p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={refundDeposit}
                onChange={(e) => setRefundDeposit(e.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              <div className="text-sm">
                <p className="font-medium">
                  Refund deposit of {formatCurrency(booking.deposit_paid)}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Logs a refund payment record. Process the refund externally
                  through {booking.deposit_method ?? 'the original payment method'}.
                </p>
              </div>
            </label>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={cancel.isPending}>
            Keep Booking
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={cancel.isPending}>
            {cancel.isPending ? 'Cancelling...' : 'Cancel Booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
