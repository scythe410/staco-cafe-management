'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { IngredientForm, type IngredientFormValues } from './ingredient-form'
import { useUpdateIngredient } from '@/hooks/useInventory'
import type { Ingredient } from '@/lib/types'

interface EditItemDialogProps {
  item: (Ingredient & { suppliers: { name: string } | null }) | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditItemDialog({ item, open, onOpenChange }: EditItemDialogProps) {
  const updateIngredient = useUpdateIngredient()

  function handleSubmit(values: IngredientFormValues) {
    if (!item) return
    updateIngredient.mutate(
      { id: item.id, ...values },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Ingredient</DialogTitle>
        </DialogHeader>
        <IngredientForm
          initial={item}
          onSubmit={handleSubmit}
          isPending={updateIngredient.isPending}
        />
      </DialogContent>
    </Dialog>
  )
}
