'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'

/**
 * A visible stand-in for `redirect()`, for the case where the redirect is
 * decided *after* the response has started streaming.
 *
 * `redirect()` from a server component only becomes a real HTTP redirect if it
 * is thrown before the shell is flushed. On a `force-dynamic` page that opens
 * with a database read, the layout has already gone out over the wire by then,
 * so Next has to finish the response and tell the client to navigate instead.
 * That leaves a window — page resolved to nothing, next navigation not started
 * — where the route's own `loading.tsx` has already been replaced and the
 * target's has not mounted yet. On screen it reads as a broken page: header,
 * then footer, nothing in between.
 *
 * Rendering this instead keeps a spinner up for that whole window. The router
 * holds it on screen until the destination's loading boundary is ready, so the
 * feedback is continuous from click to arrival.
 */
export function Redirecting({ to, label }: { to: string; label: string }) {
  const router = useRouter()

  useEffect(() => {
    router.replace(to)
  }, [router, to])

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center"
    >
      <Spinner className="size-8 text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
