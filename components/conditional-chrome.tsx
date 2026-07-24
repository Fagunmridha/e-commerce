'use client'

import { usePathname } from 'next/navigation'

/**
 * Hides the global site chrome (header/footer) on standalone landing pages.
 * Facebook-ad landing pages live under `/lp/*` and are meant to be a
 * distraction-free, single-product funnel — no nav, no footer.
 */
export function ConditionalChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname?.startsWith('/lp')) return null

  return <>{children}</>
}
