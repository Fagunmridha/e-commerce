'use client'

import { usePathname } from 'next/navigation'

/**
 * Hides the global site chrome (header/footer) on routes that own their whole
 * viewport:
 *  - `/lp/*` — Facebook-ad landing pages, a distraction-free single-product
 *    funnel with no nav and no footer.
 *  - `/admin/*` — the admin panel ships its own sidebar and header, so the
 *    storefront chrome would sit on top of it.
 */
const BARE_ROUTES = ['/lp', '/admin']

export function ConditionalChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (BARE_ROUTES.some((route) => pathname?.startsWith(route))) return null

  return <>{children}</>
}
