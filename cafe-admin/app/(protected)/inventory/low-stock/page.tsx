import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { LowStockTable } from '@/components/inventory/low-stock-table'

export default async function LowStockPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Low Stock Alerts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ingredients below minimum stock level
        </p>
      </div>
      <LowStockTable userId={user.id} />
    </div>
  )
}
