import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import { ProtectedShell } from '@/components/shared/protected-shell'
import type { Role } from '@/constants/roles'

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

  const userName = (user.user_metadata?.full_name as string) ?? user.email ?? 'User'
  const userRole = (user.user_metadata?.role ?? user.app_metadata?.role ?? 'cashier') as Role

  return (
    <ProtectedShell userName={userName} userRole={userRole}>
      {children}
    </ProtectedShell>
  )
}
