'use client'

import { Bell, AlertTriangle, DollarSign, ShoppingCart, Info, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllRead,
  useRealtimeNotifications,
} from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import type { Notification } from '@/lib/types'

const TYPE_ICONS: Record<Notification['type'], typeof Bell> = {
  low_stock: AlertTriangle,
  salary_due: DollarSign,
  order: ShoppingCart,
  system: Info,
}

const TYPE_COLORS: Record<Notification['type'], string> = {
  low_stock: 'text-destructive',
  salary_due: 'text-amber-600',
  order: 'text-blue-600',
  system: 'text-muted-foreground',
}

export function NotificationBell() {
  useRealtimeNotifications()

  const { data: notifications } = useNotifications()
  const { data: unreadCount } = useUnreadCount()
  const markAsRead = useMarkAsRead()
  const markAllRead = useMarkAllRead()

  const displayed = (notifications ?? []).slice(0, 10)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10">
          <Bell className="h-5 w-5" />
          {!!unreadCount && unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {!!unreadCount && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-muted-foreground"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[360px] overflow-y-auto">
          {displayed.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            displayed.map((n) => {
              const Icon = TYPE_ICONS[n.type]
              return (
                <button
                  key={n.id}
                  className={cn(
                    'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50',
                    !n.is_read && 'bg-accent/30',
                  )}
                  onClick={() => {
                    if (!n.is_read) markAsRead.mutate(n.id)
                  }}
                >
                  <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', TYPE_COLORS[n.type])} />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm leading-snug', !n.is_read && 'font-medium')}>
                      {n.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.is_read && (
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
