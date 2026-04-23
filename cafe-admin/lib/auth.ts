import { createBrowserClient } from '@/lib/supabase'

/**
 * Ensures the current session is fresh before a mutation runs.
 * If the access token is expired or expires within 60 seconds,
 * refresh it. Returns true on success, false if refresh fails.
 */
export async function ensureFreshSession(): Promise<boolean> {
  const supabase = createBrowserClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) return false

  const expiresAt = session.expires_at ?? 0
  const nowSec = Math.floor(Date.now() / 1000)
  const secondsLeft = expiresAt - nowSec

  if (secondsLeft < 60) {
    const { data, error } = await supabase.auth.refreshSession()
    if (error || !data.session) return false
  }

  return true
}
