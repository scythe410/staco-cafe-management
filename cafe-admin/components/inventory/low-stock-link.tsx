'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLowStockCount } from '@/hooks/useInventory'

export function LowStockLink() {
  const { data: count } = useLowStockCount()

  if (!count) return null

  return (
    <Button variant="outline" size="sm" className="h-9 gap-1.5" asChild>
      <Link href="/inventory/low-stock">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        Low Stock
        <Badge variant="destructive" className="text-xs ml-1">
          {count}
        </Badge>
      </Link>
    </Button>
  )
}
