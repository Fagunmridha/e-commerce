import {
  LayoutDashboard,
  Plus,
  ShoppingCart,
  Store,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { Dictionary } from '@/lib/dictionaries'

type NavCopy = Dictionary['wholesale']['nav']

export type SellerNavItem = {
  href: string
  /** Key into `t.wholesale.nav` — the seller area is fully translated. */
  labelKey: keyof NavCopy
  icon: LucideIcon
  /** A route with no page yet: listed, but disabled rather than linking to a 404. */
  planned?: boolean
  /** Leaves the seller shell, back into the storefront chrome. */
  external?: boolean
}

export type SellerNavGroup = {
  labelKey: keyof NavCopy
  items: SellerNavItem[]
}

/**
 * The seller panel's navigation, mirroring the admin sidebar's shape — only
 * routes that have a page. `planned: true` lists an entry as disabled instead
 * of pointing at a page that does not exist yet.
 */
export const SELLER_NAV: SellerNavGroup[] = [
  {
    labelKey: 'groupShop',
    items: [
      {
        href: '/wholesale/dashboard',
        labelKey: 'listings',
        icon: LayoutDashboard,
      },
      {
        href: '/wholesale/dashboard/products/new',
        labelKey: 'addProduct',
        icon: Plus,
      },
    ],
  },
  {
    labelKey: 'groupSales',
    items: [
      {
        href: '/wholesale/dashboard/orders',
        labelKey: 'orders',
        icon: ShoppingCart,
      },
      // Outside the dashboard's route group on purpose — a suspended shop can
      // still read what it is owed, and that gate lives on /wholesale/payouts.
      // From the sidebar it is just an href, so nothing here has to know.
      {
        href: '/wholesale/payouts',
        labelKey: 'payouts',
        icon: Wallet,
      },
    ],
  },
  {
    labelKey: 'groupMarket',
    items: [
      {
        href: '/wholesale/market',
        labelKey: 'market',
        icon: Store,
        external: true,
      },
    ],
  },
]

/**
 * Label for the page currently open, for the header breadcrumb. The product
 * form routes are nested under the dashboard and have no nav entry of their
 * own, so they resolve to their form titles.
 */
export function sellerCrumb(
  pathname: string,
  t: Dictionary,
  entityLabel = '',
): string {
  const copy = t.wholesale

  // Checked before the prefix test below, so "Add a product" never picks up a
  // listing's name.
  if (pathname === '/wholesale/dashboard/products/new')
    return copy.dashboard.newTitle
  if (pathname.startsWith('/wholesale/dashboard/products/'))
    // The listing's own name once the page registers it; until then the form's
    // title, which is at least true.
    return entityLabel || copy.dashboard.editTitle

  // Same shape for the payout routes: `/wholesale/payouts` itself matches the
  // nav lookup below, but `/wholesale/payouts/<uuid>` and `/statement` would
  // otherwise fall through to "My listings".
  if (pathname === '/wholesale/payouts/statement')
    return copy.payouts.statementTitle
  if (pathname.startsWith('/wholesale/payouts/'))
    return entityLabel || copy.nav.payouts

  const match = SELLER_NAV.flatMap((group) => group.items).find(
    (item) => item.href === pathname,
  )
  return match ? copy.nav[match.labelKey] : copy.nav.listings
}
