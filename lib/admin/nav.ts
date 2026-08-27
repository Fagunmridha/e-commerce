import {
  CalendarClock,
  Layers,
  LayoutDashboard,
  Mail,
  MessageSquareQuote,
  Package,
  Percent,
  ReceiptText,
  Settings,
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
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
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
        href: '/admin/catalogues',
        label: 'Catalogues',
        icon: Layers,
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
      // Sales, next to Wholesalers: a settlement is what the store owes one of
      // those shops. Approving a shop and paying it are the same person's job.
      {
        href: '/admin/settlements',
        label: 'Settlements',
        icon: ReceiptText,
        children: [
          { href: '/admin/settlements', label: 'All settlements' },
          { href: '/admin/settlements?status=due', label: 'Due' },
          { href: '/admin/settlements/statement', label: 'Statement' },
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
      // Sales rather than Catalogue: a contact message is a person waiting on
      // an answer, usually about an order — the same work as Orders and
      // Customers, not the shelf-stacking work of Products and Reviews.
      {
        href: '/admin/contact',
        label: 'Messages',
        icon: Mail,
        children: [
          { href: '/admin/contact', label: 'All messages' },
          { href: '/admin/contact?status=new', label: 'New' },
        ],
      },
    ],
  },
]

/**
 * Sections with a `[id]` detail page, and the word the crumb shows until the
 * page hands up the row's real name.
 *
 * An explicit table rather than detecting an id by its shape, because that
 * cannot work here: product ids are hand-written slugs (`w-karims-cotton-shirt`),
 * character-for-character indistinguishable from a static child like
 * `add-product`, and user ids are plain integers.
 *
 * Add a row when a section gains a detail page, or its breadcrumb goes back to
 * humanising the raw id.
 */
const DETAIL_SECTIONS: Record<string, string> = {
  orders: 'Order',
  users: 'Customer',
  wholesalers: 'Wholesaler',
  coupons: 'Coupon',
  products: 'Product',
  settlements: 'Settlement',
}

/**
 * Children of those sections that are pages in their own right, not an id.
 *
 * `statement` is load-bearing: `/admin/settlements/statement` would otherwise
 * be read as a settlement id and crumb as "Settlement". `print` needs no entry
 * — its parent segment is a uuid, which is not a `DETAIL_SECTIONS` key, so it
 * falls through to `humanize`.
 */
const STATIC_CHILDREN: Record<string, string> = {
  new: 'New',
  statement: 'Statement',
}

/**
 * Sections whose URL and sidebar label disagree. Not derived from `ADMIN_NAV`
 * programmatically — its `children` hrefs carry query strings that collapse onto
 * the same path and would collide in a map.
 */
const SECTION_LABELS: Record<string, string> = {
  users: 'Customers',
  preorders: 'Pre-orders',
  contact: 'Messages',
}

export type AdminCrumb = { label: string; href?: string }

/**
 * The breadcrumb trail for an admin pathname.
 *
 * `entityLabel` is what the open detail page calls the row it loaded — empty
 * until it registers, see `components/breadcrumb-label.tsx`.
 */
export function adminBreadcrumb(
  pathname: string,
  entityLabel = '',
): AdminCrumb[] {
  if (pathname === '/admin') return [{ label: 'Dashboard' }]

  const segments = pathname.replace(/^\/admin\/?/, '').split('/').filter(Boolean)

  return segments.map((segment, index) => {
    // Every section is a real page, so a non-terminal crumb can always link to
    // its own path. The last one is the current page and stays unlinked.
    const href =
      index === segments.length - 1
        ? undefined
        : `/admin/${segments.slice(0, index + 1).join('/')}`

    const section = index > 0 ? DETAIL_SECTIONS[segments[index - 1]] : undefined
    if (section && !STATIC_CHILDREN[segment]) {
      return { label: entityLabel || section, href }
    }

    return {
      label: STATIC_CHILDREN[segment] ?? SECTION_LABELS[segment] ?? humanize(segment),
      href,
    }
  })
}

/** `add-product` → "Add product". Short segments are read as acronyms. */
function humanize(segment: string): string {
  return segment.length <= 3
    ? segment.toUpperCase()
    : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
}
