import type { Localized } from '@/lib/i18n'

/**
 * A category's URL slug. Categories are rows in the database and the admin can
 * add or remove them, so this is a plain string rather than a fixed union —
 * nothing in the app may assume a particular set of categories exists.
 */
export type CategorySlug = string

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
  colors?: Localized[]
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
   * Set when an approved wholesaler listed this rather than the store itself.
   * Marketplace lines are shown in the wholesale section and kept out of the
   * ordinary shop listings, but are otherwise bought exactly like any other
   * product.
   */
  sellerId?: string
  /** The seller's shop name, for the "sold by" line. */
  sellerName?: string
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
