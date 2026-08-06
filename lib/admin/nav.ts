import {
  CalendarClock,
  LayoutDashboard,
  MessageSquareQuote,
  Package,
  Percent,
  ShoppingCart,
  Store,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type AdminNavItem = {
  href: string
  label: string
  icon: LucideIcon
  /** Rendered as a collapsible sub-menu under the parent. */
  children?: { href: string; label: string }[]
  /** Marks a route that has no UI yet, so the sidebar can say so honestly. */
  planned?: boolean
}

export type AdminNavGroup = {
  label: string
  items: AdminNavItem[]
}

/**
 * The admin navigation tree — only modules that have a page. Setting
 * `planned: true` on an entry lists it as disabled instead of linking to a
 * 404, which is how a module gets a slot here before its page exists.
 */
export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: 'Overview',
    items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Catalogue',
    items: [
      {
        href: '/admin/products',
        label: 'Products',
        icon: Package,
        children: [
          { href: '/admin/products', label: 'All products' },
          { href: '/admin/products/new', label: 'Add product' },
        ],
      },
      {
        href: '/admin/preorders',
        label: 'Pre-orders',
        icon: CalendarClock,
      },
      // Catalogue rather than Sales: approving a review changes a product's
      // star rating and its detail page. The person doing it is the same one
      // who lives in Products and Pre-orders; Sales is money and people.
      {
        href: '/admin/reviews',
        label: 'Reviews',
        icon: MessageSquareQuote,
        children: [
          { href: '/admin/reviews', label: 'All reviews' },
          { href: '/admin/reviews?status=pending', label: 'Pending' },
        ],
      },
    ],
  },
  {
    label: 'Sales',
    items: [
      {
        href: '/admin/orders',
        label: 'Orders',
        icon: ShoppingCart,
        children: [
          { href: '/admin/orders', label: 'All orders' },
          { href: '/admin/orders?status=pending', label: 'Pending' },
          { href: '/admin/orders?status=shipped', label: 'Shipped' },
        ],
      },
      {
        href: '/admin/users',
        label: 'Customers',
        icon: Users,
        children: [
          { href: '/admin/users', label: 'All customers' },
          { href: '/admin/users?role=admin', label: 'Admins' },
        ],
      },
      {
        href: '/admin/wholesalers',
        label: 'Wholesalers',
        icon: Store,
        children: [
          { href: '/admin/wholesalers', label: 'All applications' },
        ],
      },
      {
        href: '/admin/coupons',
        label: 'Coupons',
        icon: Percent,
        children: [
          { href: '/admin/coupons', label: 'All coupons' },
          { href: '/admin/coupons/new', label: 'Add coupon' },
        ],
      },
    ],
  },
]

/** Human-readable label for a admin pathname, used by the header breadcrumb. */
export function adminBreadcrumb(pathname: string): string[] {
  if (pathname === '/admin') return ['Dashboard']

  const segments = pathname.replace(/^\/admin\/?/, '').split('/').filter(Boolean)

  return segments.map((segment) =>
    segment.length <= 3
      ? segment.toUpperCase()
      : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
  )
}
