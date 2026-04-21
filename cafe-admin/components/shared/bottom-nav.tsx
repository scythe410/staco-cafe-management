'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/constants/navigation'
import { useLowStockCount } from '@/hooks/useInventory'

export function BottomNav() {
  const pathname = usePathname()
  const { data: lowStockCount } = useLowStockCount()

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t bg-background">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] px-2 py-1 rounded-md transition-colors',
                isActive
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span className="relative">
                <item.icon className="h-5 w-5" />
                {item.href === '/inventory' && !!lowStockCount && (
                  <span className="absolute -top-1.5 -right-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive/10 px-1 text-[9px] font-medium text-destructive">
                    {lowStockCount}
                  </span>
                )}
              </span>
              <span className="text-[10px] leading-tight">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
