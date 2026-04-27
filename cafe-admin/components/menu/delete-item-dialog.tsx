'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useDeleteMenuItem, useMenuItemUsageCount } from '@/hooks/useMenu'
import type { MenuItem } from '@/lib/types'

interface DeleteItemDialogProps {
  item: MenuItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteItemDialog({ item, open, onOpenChange }: DeleteItemDialogProps) {
  const deleteMenuItem = useDeleteMenuItem()
  const { data: usageCount, isLoading: usageLoading } = useMenuItemUsageCount(
    open ? item?.id ?? null : null,
  )

  if (!item) return null

  const inUse = (usageCount ?? 0) > 0
  const isPending = deleteMenuItem.isPending || usageLoading

  function handleConfirm(e: React.MouseEvent) {
    if (!item) return
    if (inUse) {
      e.preventDefault()
      return
    }
    deleteMenuItem.mutate(item.id, {
      onSuccess: () => onOpenChange(false),
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {inUse ? 'Cannot delete menu item' : 'Delete menu item?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {inUse
              ? `Cannot delete — this item appears in ${usageCount} past order${
                  usageCount === 1 ? '' : 's'
                }. Mark it as unavailable instead to hide it from new orders while keeping order history intact.`
              : `This will permanently delete '${item.name}'. Existing orders containing this item will not be affected. This cannot be undone.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11">
            {inUse ? 'Close' : 'Cancel'}
          </AlertDialogCancel>
          {!inUse && (
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isPending}
              className="h-11 bg-destructive/10 text-destructive hover:bg-destructive/20"
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
