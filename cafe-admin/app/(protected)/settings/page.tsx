import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { parseRole, ROLES } from '@/constants/roles'
import { SettingsView } from '@/components/settings/settings-view'

export default async function SettingsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: dbUser } = await supabase
    .from('users')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single()

  const userRole = parseRole(dbUser?.role)
  if (!userRole) redirect('/auth/login')
  if (userRole !== ROLES.OWNER) redirect('/dashboard')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <SettingsView
        userName={dbUser?.full_name ?? user.email ?? 'Owner'}
        userEmail={dbUser?.email ?? user.email ?? ''}
        userRole={userRole}
      />
    </div>
  )
}
