'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MenuItemForm, type MenuItemFormValues } from './menu-item-form'
import { useUpdateMenuItem } from '@/hooks/useMenu'
import type { MenuItem } from '@/lib/types'

interface EditItemDialogProps {
  item: MenuItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditItemDialog({ item, open, onOpenChange }: EditItemDialogProps) {
  const updateMenuItem = useUpdateMenuItem()

  function handleSubmit(values: MenuItemFormValues) {
    if (!item) return
    updateMenuItem.mutate(
      { id: item.id, ...values },
      { onSuccess: () => onOpenChange(false) },
    )
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Menu Item</DialogTitle>
        </DialogHeader>
        <MenuItemForm
          initial={item}
          onSubmit={handleSubmit}
          isPending={updateMenuItem.isPending}
        />
      </DialogContent>
    </Dialog>
  )
}
