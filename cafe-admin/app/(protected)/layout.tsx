import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import { ProtectedShell } from '@/components/shared/protected-shell'
import { parseRole } from '@/constants/roles'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  // Read authoritative role from DB, not JWT metadata (users can modify their own metadata)
  const { data: dbUser } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const userRole = parseRole(dbUser?.role)
  if (!userRole) {
    redirect('/auth/login')
  }

  const userName = (dbUser?.full_name as string) ?? user.email ?? 'User'

  return (
    <ProtectedShell userName={userName} userRole={userRole}>
      {children}
    </ProtectedShell>
  )
}
