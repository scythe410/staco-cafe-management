import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { OrdersTable } from '@/components/orders/orders-table'
import { OrderRealtimeListener } from '@/components/orders/realtime-listener'
import { parseRole } from '@/constants/roles'

export default async function OrdersPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: dbUser } = await supabase.from('users').select('role').eq('id', user.id).single()
  const userRole = parseRole(dbUser?.role)
  if (!userRole) redirect('/auth/login')

  return (
    <div className="space-y-6">
      <OrderRealtimeListener />
      <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
      <OrdersTable userRole={userRole} />
    </div>
  )
}
