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
  /**
   * Which catalogue within `category` this belongs to, if any. Undefined for
   * stock that predates catalogues or that the admin has not sorted yet — such
   * a product still shows under "All", and drops out the moment a catalogue
   * filter is applied.
   */
  catalogue?: CatalogueSlug
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
  /**
   * The seller's shop name.
   *
   * Populated by the *admin* loaders only, never by a storefront or market
   * query: the two wholesalers either side of a trade must not learn each
   * other's identity, so a buyer's page has no business carrying this. See
   * `sellerIsVisible` in lib/products.ts, which gates the same relationship
   * without handing the name out.
   */
  sellerName?: string
  /**
   * The store's cut of this listing, as a percentage. Undefined means the store
   * default (`DEFAULT_COMMISSION_PCT`); 0 means the store takes nothing. Read
   * it through `commissionPct()` rather than directly, so the fallback lives in
   * one place.
   *
   * Admin-only, like `sellerName` — it is set on the admin product form and
   * shown nowhere a buyer or a seller can reach.
   */
  commissionPct?: number
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

/**
 * A catalogue's URL slug — "jeans", "borka". Store-wide unique, so it stands
 * alone in a query string without its category for company.
 */
export type CatalogueSlug = string

/**
 * The second level of the tree: Jeans and Shirts under Men's, Borka and Saree
 * under Women's. Shown as the dropdown on a category page and as the second
 * filter in the wholesale market.
 */
export type Catalogue = {
  slug: CatalogueSlug
  /** The category this hangs under. */
  categorySlug: CategorySlug
  name: Localized
  /** Admin-controlled order within the parent category. */
  position: number
}

export type Review = {
  id: string
  productId: string
  authorName: string
  rating: number
  body: string
  createdAt: string
}

/**
 * Where a review sits in moderation. `pending` is where every submission
 * starts; only `approved` is ever public.
 */
export type ReviewStatus = 'pending' | 'approved' | 'rejected'

/**
 * A review as the homepage testimonial rail renders it — the product it is
 * about travels with it, so the quote can be attributed and linked.
 */
export type HomeReview = {
  id: string
  authorName: string
  rating: number
  body: string
  createdAt: string
  productId: string
  productName: Localized
}
