'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
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
import { useCreateExpense } from '@/hooks/useFinance'
import { validatePositiveNumber } from '@/lib/validation'
import { toast } from 'sonner'
import {
  EXPENSE_CATEGORY,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
} from '@/constants/expenses'

interface AddExpenseDialogProps {
  userId: string
}

export function AddExpenseDialog({ userId }: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false)
  const createExpense = useCreateExpense()

  const [category, setCategory] = useState<ExpenseCategory>(EXPENSE_CATEGORY.INGREDIENTS)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))

  function resetForm() {
    setCategory(EXPENSE_CATEGORY.INGREDIENTS)
    setAmount('')
    setDescription('')
    setDate(new Date().toISOString().slice(0, 10))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const amtErr = validatePositiveNumber(amount, 'Amount')
    if (amtErr) { toast.error(amtErr); return }

    createExpense.mutate(
      {
        category,
        amount: Math.round(parseFloat(amount) * 100),
        description: description.trim() || null,
        date,
        recorded_by: userId,
      },
      {
        onSuccess: () => {
          resetForm()
          setOpen(false)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 gap-1.5">
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(EXPENSE_CATEGORY).map((c) => (
                  <SelectItem key={c} value={c}>
                    {EXPENSE_CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expAmount">Amount (LKR)</Label>
            <Input
              id="expAmount"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-11"
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expDate">Date</Label>
            <Input
              id="expDate"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expDesc">Description (optional)</Label>
            <Textarea
              id="expDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full h-11" disabled={createExpense.isPending}>
            {createExpense.isPending ? 'Saving...' : 'Add Expense'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
