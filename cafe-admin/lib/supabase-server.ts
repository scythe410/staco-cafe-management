import { createServerClient as _createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { CookieMethodsServer } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ─── Server client ───────────────────────────────────────────────
// Use in Server Components, Server Actions, and Route Handlers.
// Reads and writes session cookies so the session stays in sync
// between browser and server without exposing the service role key.
export async function createServerClient() {
  const cookieStore = await cookies()

  return _createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // setAll is called from Server Components where cookie mutation
          // is not allowed. The middleware keeps the session fresh so
          // this is safe to swallow here.
        }
      },
    } satisfies CookieMethodsServer,
  })
}
