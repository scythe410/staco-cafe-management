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
import { MenuItemForm, type MenuItemFormValues } from './menu-item-form'
import { useCreateMenuItem } from '@/hooks/useMenu'

export function AddItemDialog() {
  const [open, setOpen] = useState(false)
  const createMenuItem = useCreateMenuItem()

  function handleSubmit(values: MenuItemFormValues) {
    createMenuItem.mutate(values, {
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
          <DialogTitle>Add Menu Item</DialogTitle>
        </DialogHeader>
        <MenuItemForm
          onSubmit={handleSubmit}
          isPending={createMenuItem.isPending}
        />
      </DialogContent>
    </Dialog>
  )
}
