import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { EmployeesTable } from '@/components/employees/employees-table'
import { parseRole } from '@/constants/roles'

export default async function EmployeesPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: dbUser } = await supabase.from('users').select('role').eq('id', user.id).single()
  const userRole = parseRole(dbUser?.role)
  if (!userRole) redirect('/auth/login')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
      <EmployeesTable userRole={userRole} />
    </div>
  )
}
