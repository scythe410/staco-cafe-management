import { createBrowserClient as _createBrowserClient, createServerClient as _createServerClient } from '@supabase/ssr'
import type { CookieMethodsServer } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ─── Browser client ─────────────────────────────────────────────
// Use in Client Components. Call once per component — does not
// create a new socket on each call thanks to internal singleton logic.
export function createBrowserClient() {
  return _createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// ─── Proxy (middleware) client ───────────────────────────────────
// Use exclusively in proxy.ts. Receives the raw request/response
// so it can forward Set-Cookie headers back to the browser.
export function createProxyClient(
  request: Request,
  response: Response,
) {
  return _createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get('cookie') ?? '')
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const cookieValue = serializeCookie(name, value, options)
          response.headers.append('Set-Cookie', cookieValue)
        })
      },
    } satisfies CookieMethodsServer,
  })
}

// ─── Helpers ─────────────────────────────────────────────────────
function parseCookieHeader(header: string): { name: string; value: string }[] {
  if (!header) return []
  return header.split(';').map((pair) => {
    const [name, ...rest] = pair.trim().split('=')
    return { name: name.trim(), value: rest.join('=').trim() }
  })
}

function serializeCookie(
  name: string,
  value: string,
  options: Record<string, unknown> = {},
): string {
  let cookie = `${name}=${value}`
  if (options.maxAge) cookie += `; Max-Age=${options.maxAge}`
  if (options.path) cookie += `; Path=${options.path}`
  if (options.domain) cookie += `; Domain=${options.domain}`
  // Default to Lax if Supabase SSR doesn't specify — prevents CSRF
  cookie += `; SameSite=${options.sameSite ?? 'Lax'}`
  if (options.httpOnly) cookie += '; HttpOnly'
  // Default to Secure in production
  if (options.secure || (!options.secure && typeof window === 'undefined')) cookie += '; Secure'
  return cookie
}
