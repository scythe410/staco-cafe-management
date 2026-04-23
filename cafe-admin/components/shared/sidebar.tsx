'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/constants/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { useLowStockCount } from '@/hooks/useInventory'
import { ROLES, ROLE_ALLOWED_ROUTES, type Role } from '@/constants/roles'

interface SidebarProps {
  userName: string
  userRole: Role
}

export function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: lowStockCount } = useLowStockCount()

  async function handleSignOut() {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 border-r bg-sidebar">
      {/* Brand */}
      <div className="flex h-16 items-center px-3 border-b">
        <Image
          src="/logos/logo-owl.png"
          alt="Stacko Cafe logo"
          width={40}
          height={40}
          className="-mr-2"
        />
        <h1 className="text-lg font-semibold tracking-tight">Stacko Cafe</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.filter((item) => {
          if (userRole === ROLES.OWNER) return true
          const allowed = ROLE_ALLOWED_ROUTES[userRole] ?? []
          return allowed.some((prefix) => item.href.startsWith(prefix))
        }).map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                'min-h-[44px]',
                isActive
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.href === '/inventory' && !!lowStockCount && (
                <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive/10 px-1.5 text-[10px] font-medium text-destructive">
                  {lowStockCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User info + sign out */}
      <div className="border-t px-3 py-4 space-y-2">
        <div className="px-3">
          <p className="text-sm font-medium truncate">{userName}</p>
          <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
        </div>
        <button
          onClick={handleSignOut}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm',
            'min-h-[44px] text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors',
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
