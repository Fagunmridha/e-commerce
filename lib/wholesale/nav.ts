import {
  BarChart3,
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
 * The seller panel's navigation, mirroring the admin sidebar's shape. Only the
 * three real routes link anywhere; the rest carry `planned` so the information
 * architecture is visible without pointing at pages that do not exist.
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
      {
        href: '/wholesale/dashboard/payouts',
        labelKey: 'payouts',
        icon: Wallet,
        planned: true,
      },
      {
        href: '/wholesale/dashboard/insights',
        labelKey: 'insights',
        icon: BarChart3,
        planned: true,
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
export function sellerCrumb(pathname: string, t: Dictionary): string {
  const copy = t.wholesale

  if (pathname === '/wholesale/dashboard/products/new')
    return copy.dashboard.newTitle
  if (pathname.startsWith('/wholesale/dashboard/products/'))
    return copy.dashboard.editTitle

  const match = SELLER_NAV.flatMap((group) => group.items).find(
    (item) => item.href === pathname,
  )
  return match ? copy.nav[match.labelKey] : copy.nav.listings
}
