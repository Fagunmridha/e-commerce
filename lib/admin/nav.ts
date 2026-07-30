import {
  BarChart3,
  Bell,
  Boxes,
  CreditCard,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  MessageSquareText,
  Package,
  Percent,
  Settings,
  ShoppingCart,
  Star,
  Store,
  Tag,
  Truck,
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
 * The admin navigation tree. `planned: true` marks a module whose page has not
 * been built yet — the sidebar still lists it (so the information architecture
 * is visible) but shows it as disabled rather than linking to a 404.
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
      { href: '/admin/categories', label: 'Categories', icon: Tag, planned: true },
      { href: '/admin/brands', label: 'Brands', icon: Boxes, planned: true },
      {
        href: '/admin/inventory',
        label: 'Inventory',
        icon: Boxes,
        planned: true,
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
      { href: '/admin/reviews', label: 'Reviews', icon: Star, planned: true },
      {
        href: '/admin/coupons',
        label: 'Coupons',
        icon: Percent,
        children: [
          { href: '/admin/coupons', label: 'All coupons' },
          { href: '/admin/coupons/new', label: 'Add coupon' },
        ],
      },
      {
        href: '/admin/payments',
        label: 'Payments',
        icon: CreditCard,
        planned: true,
      },
      { href: '/admin/shipping', label: 'Shipping', icon: Truck, planned: true },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/blog', label: 'Blog', icon: FileText, planned: true },
      {
        href: '/admin/media',
        label: 'Media Library',
        icon: ImageIcon,
        planned: true,
      },
    ],
  },
  {
    label: 'Insights',
    items: [
      {
        href: '/admin/analytics',
        label: 'Analytics',
        icon: BarChart3,
        planned: true,
      },
      {
        href: '/admin/reports',
        label: 'Reports',
        icon: FileText,
        planned: true,
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        href: '/admin/notifications',
        label: 'Notifications',
        icon: Bell,
        planned: true,
      },
      {
        href: '/admin/settings',
        label: 'Settings',
        icon: Settings,
        planned: true,
      },
      {
        href: '/admin/support',
        label: 'Support',
        icon: MessageSquareText,
        planned: true,
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
