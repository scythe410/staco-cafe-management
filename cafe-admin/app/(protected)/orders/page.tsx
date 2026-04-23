import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { OrdersTable } from '@/components/orders/orders-table'
import { OrderRealtimeListener } from '@/components/orders/realtime-listener'
import type { Role } from '@/constants/roles'

export default async function OrdersPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const userRole = (user.user_metadata?.role ?? user.app_metadata?.role ?? 'cashier') as Role

  return (
    <div className="space-y-6">
      <OrderRealtimeListener />
      <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
      <OrdersTable userRole={userRole} />
    </div>
  )
}
