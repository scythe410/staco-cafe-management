'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Listens for cache invalidation messages from other tabs on the same
 * origin. When any tab invalidates a query key, all other tabs
 * invalidate the same key — keeping data in sync across multiple
 * open tablets on the same cafe account.
 */
export function useCrossTabSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('BroadcastChannel' in window)) return

    const channel = new BroadcastChannel('staco-cafe-sync')

    channel.onmessage = (event) => {
      if (event.data?.type === 'invalidate' && Array.isArray(event.data.key)) {
        queryClient.invalidateQueries({ queryKey: event.data.key })
      }
    }

    return () => channel.close()
  }, [queryClient])
}

/**
 * Call this from within mutation onSuccess callbacks to notify other
 * open tabs that they should refetch the same query keys.
 */
export function broadcastInvalidate(key: (string | number)[]) {
  if (typeof window === 'undefined') return
  if (!('BroadcastChannel' in window)) return

  const channel = new BroadcastChannel('staco-cafe-sync')
  channel.postMessage({ type: 'invalidate', key })
  channel.close()
}
