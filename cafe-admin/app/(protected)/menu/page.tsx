import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { MenuTable } from '@/components/menu/menu-table'

export default async function MenuPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Menu Items</h1>
          <p className="text-sm text-muted-foreground">
            Manage menu items, prices, and availability.
          </p>
        </div>
      </div>
      <MenuTable />
    </div>
  )
}
