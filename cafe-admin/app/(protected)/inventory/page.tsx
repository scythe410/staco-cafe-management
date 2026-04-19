import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { InventoryTable } from '@/components/inventory/inventory-table'

export default async function InventoryPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
      <InventoryTable userId={user.id} />
    </div>
  )
}
