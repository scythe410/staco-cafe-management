'use client'

import { Suspense, useState, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get('redirect') ?? '/dashboard'
  const redirect = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const failCount = useRef(0)

  const MAX_ATTEMPTS = 5
  const LOCKOUT_MS = 30_000 // 30 seconds

  const isLocked = useCallback(() => {
    if (!lockedUntil) return false
    if (Date.now() >= lockedUntil) {
      setLockedUntil(null)
      failCount.current = 0
      return false
    }
    return true
  }, [lockedUntil])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (isLocked()) {
      const secsLeft = Math.ceil(((lockedUntil ?? 0) - Date.now()) / 1000)
      setError(`Too many failed attempts. Try again in ${secsLeft} seconds.`)
      return
    }

    setError(null)
    setLoading(true)

    const supabase = createBrowserClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      failCount.current += 1
      if (failCount.current >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_MS)
        setError(`Too many failed attempts. Locked for 30 seconds.`)
      } else {
        setError(
          authError.message === 'Invalid login credentials'
            ? `Incorrect email or password. ${MAX_ATTEMPTS - failCount.current} attempts remaining.`
            : authError.message,
        )
      }
      setLoading(false)
      return
    }

    failCount.current = 0
    router.push(redirect)
    router.refresh()
  }

  return (
    <main className="min-h-screen flex flex-col items-center bg-muted/40 px-4">
      <div className="w-full max-w-sm flex-1 flex flex-col justify-center">
        {/* Logo / brand */}
        <div className="mb-2 flex justify-center pt-6">
          <Image
            src="/logos/logo-text.png"
            alt="Stacko Cafe"
            width={280}
            height={280}
            priority
          />
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@staco.lk"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-base"
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={loading || isLocked()}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Powered by NeuralShift */}
      <div className="mt-auto pb-4 flex flex-col items-center gap-0.5">
        <p className="text-xs text-muted-foreground">Powered by</p>
        <Image
          src="/logos/neuralshift-logo.png"
          alt="NeuralShift"
          width={120}
          height={28}
        />
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </main>
    }>
      <LoginForm />
    </Suspense>
  )
}
