'use client'

import { usePathname } from 'next/navigation'

/**
 * Hides the global site chrome (header/footer) on routes that own their whole
 * viewport:
 *  - `/lp/*` — Facebook-ad landing pages, a distraction-free single-product
 *    funnel with no nav and no footer.
 *  - `/admin/*` — the admin panel ships its own sidebar and header, so the
 *    storefront chrome would sit on top of it.
 *  - `/wholesale/dashboard/*` — the seller panel, same reason. The rest of
 *    /wholesale (the pitch, the apply form, the market) keeps the storefront
 *    chrome: those are shopping pages and need the cart.
 */
const BARE_ROUTES = ['/lp', '/admin', '/wholesale/dashboard']

export function ConditionalChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (BARE_ROUTES.some((route) => pathname?.startsWith(route))) return null

  return <>{children}</>
}
