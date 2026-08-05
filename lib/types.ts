import type { Localized } from '@/lib/i18n'

/**
 * A category's URL slug. Categories are rows in the database and the admin can
 * add or remove them, so this is a plain string rather than a fixed union —
 * nothing in the app may assume a particular set of categories exists.
 */
export type CategorySlug = string

/**
 * A selectable colourway.
 *
 * `hex` is optional on purpose. Rows created before migration 0012 carry only a
 * name, and some colourways genuinely have no single swatch colour — "Print" is
 * the canonical example. Consumers must fall back to a text pill when it is
 * absent rather than invent a colour. When present it is always lower-case
 * `#rrggbb` (normalised by `hexColorSchema`), because it goes straight into a
 * `style` attribute.
 */
export type ProductColor = { name: Localized; hex?: string }

export type Product = {
  id: string
  name: Localized
  price: number
  oldPrice?: number
  image: string
  images?: string[]
  category: CategorySlug
  badge?: 'new' | 'sale'
  sizes?: string[]
  colors?: ProductColor[]
  /** Per-product selling points — "100% Cotton", "Breathable". */
  highlights?: Localized[]
  description?: Localized
  stock: number
  /**
   * Minimum order quantity, in pieces. Undefined means no minimum — every
   * house product. Wholesalers set it per listing, and it is enforced in the
   * cart and again server-side when the order is created.
   */
  moq?: number
  /** Aggregated from the reviews table — average stars and total count. */
  rating: number
  reviews: number
  /**
   * Pieces sold, excluding cancelled orders. Derived from `order_items`, so it
   * is only populated on the detail page — the list queries would each need an
   * extra GROUP BY for a number nothing in a card shows.
   */
  sold?: number
  /**
   * Set when an approved wholesaler listed this rather than the store itself.
   * Marketplace lines are shown in the wholesale section and kept out of the
   * ordinary shop listings, but are otherwise bought exactly like any other
   * product.
   */
  sellerId?: string
  /** The seller's shop name, for the "sold by" line. */
  sellerName?: string
  /**
   * Upcoming stock, taken on pre-order. These are kept out of /shop, the
   * category pages and search — they surface only in the Coming Soon rail —
   * so nothing offers "Add to Cart" on something that cannot ship yet.
   */
  preorder?: boolean
  /** `YYYY-MM-DD`; the day bookings are promised to ship from. */
  preorderShipsAt?: string
  /**
   * Pieces already booked, excluding cancelled orders. Only populated by the
   * queries that render pre-order cards — the ordinary listing queries would
   * each need an extra aggregate for a number they never show. `stock` is what
   * is *left* of the allocation, so booked + stock is the original run.
   */
  preorderBooked?: number
  /**
   * Percentage of the goods value payable up front to hold a booking.
   * Undefined means the store default (`DEFAULT_ADVANCE_PCT`); 0 means the
   * pre-order is taken on pure cash-on-delivery. Read it through
   * `advancePct()` rather than directly, so the fallback lives in one place.
   */
  preorderAdvancePct?: number
}

export type Category = {
  slug: CategorySlug
  name: Localized
  href: string
  itemCount: number
  image: string
}

export type Review = {
  id: string
  productId: string
  authorName: string
  rating: number
  body: string
  createdAt: string
}
