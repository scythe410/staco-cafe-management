import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { SalaryTable } from '@/components/employees/salary-table'
import type { Role } from '@/constants/roles'

export default async function SalaryPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const userRole = (user.user_metadata?.role ?? user.app_metadata?.role ?? 'cashier') as Role

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Salary Management</h1>
      <SalaryTable userRole={userRole} />
    </div>
  )
}
