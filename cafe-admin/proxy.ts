// proxy.ts — Next.js route protection (renamed from middleware.ts for Next.js 16)
// Runs before every matched request. Validates Supabase session and
// enforces role-based access control per the permissions in constants/roles.ts.

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createProxyClient } from '@/lib/supabase'
import { ROLES, ROLE_ALLOWED_ROUTES, PUBLIC_AUTH_ROUTES, type Role } from '@/constants/roles'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Build a mutable response so @supabase/ssr can write refreshed
  // session cookies back to the browser on every request.
  const response = NextResponse.next()
  const supabase = createProxyClient(request, response)

  // Refresh session if expired — supabase/ssr handles the token rotation
  // and writes the updated cookie to `response` via setAll above.
  const { data: { user } } = await supabase.auth.getUser()

  const isPublicAuthRoute = PUBLIC_AUTH_ROUTES.some((route) =>
    pathname.startsWith(route),
  )

  // Unauthenticated — allow through to /auth/*, block everything else
  if (!user) {
    if (isPublicAuthRoute) return response
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Already authenticated — redirect away from login page
  if (isPublicAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Fetch role from user metadata (set during sign-up / admin seed)
  const role = (user.user_metadata?.role ?? user.app_metadata?.role ?? '') as Role

  // Redirect root to dashboard for all authenticated users
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Owner has unrestricted access
  if (role === ROLES.OWNER) return response

  // Validate role value
  const allowedRoutes = ROLE_ALLOWED_ROUTES[role]
  if (!allowedRoutes) {
    // Unknown role — sign out and redirect to login
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Check if the current path starts with any of the role's allowed prefixes
  const isAllowed = allowedRoutes.some((prefix) => pathname.startsWith(prefix))
  if (!isAllowed) {
    // Redirect to the first route the role is permitted to visit
    return NextResponse.redirect(new URL(allowedRoutes[0], request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static  (Next.js static assets)
     * - _next/image   (image optimisation)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public folder assets (*.png, *.svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
