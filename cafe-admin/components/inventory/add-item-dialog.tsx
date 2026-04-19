'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { IngredientForm, type IngredientFormValues } from './ingredient-form'
import { useCreateIngredient } from '@/hooks/useInventory'

export function AddItemDialog() {
  const [open, setOpen] = useState(false)
  const createIngredient = useCreateIngredient()

  function handleSubmit(values: IngredientFormValues) {
    createIngredient.mutate(values, {
      onSuccess: () => setOpen(false),
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Ingredient</DialogTitle>
        </DialogHeader>
        <IngredientForm onSubmit={handleSubmit} isPending={createIngredient.isPending} />
      </DialogContent>
    </Dialog>
  )
}
