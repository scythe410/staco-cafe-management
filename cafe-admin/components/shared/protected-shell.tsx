'use client'

import { Sidebar } from '@/components/shared/sidebar'
import { BottomNav } from '@/components/shared/bottom-nav'
import { NotificationBell } from '@/components/shared/notification-bell'
import type { Role } from '@/constants/roles'

interface ProtectedShellProps {
  userName: string
  userRole: Role
  children: React.ReactNode
}

export function ProtectedShell({ userName, userRole, children }: ProtectedShellProps) {
  return (
    <div className="min-h-screen">
      <Sidebar userName={userName} userRole={userRole} />

      {/* Main content — offset by sidebar on lg+, offset by bottom nav below lg */}
      <main className="lg:pl-60 pb-20 lg:pb-0">
        {/* Top bar with notification bell */}
        <div className="flex items-center justify-end h-14 px-6 border-b">
          <NotificationBell />
        </div>
        <div className="p-6">{children}</div>
      </main>

      <BottomNav />
    </div>
  )
}
