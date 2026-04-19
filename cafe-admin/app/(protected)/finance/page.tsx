import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { FinanceTabs } from '@/components/finance/finance-tabs'

export default async function FinancePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Financial Analytics</h1>
      <FinanceTabs userId={user.id} />
    </div>
  )
}
