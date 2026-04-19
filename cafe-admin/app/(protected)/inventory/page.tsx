import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { InventoryTable } from '@/components/inventory/inventory-table'
import { LowStockLink } from '@/components/inventory/low-stock-link'

export default async function InventoryPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
        <LowStockLink />
      </div>
      <InventoryTable userId={user.id} />
    </div>
  )
}
