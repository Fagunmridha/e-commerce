import type { Localized } from '@/lib/i18n'

export type CategorySlug = 'men' | 'women' | 'kids' | 'accessories'

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
  /** Aggregated from the reviews table — average stars and total count. */
  rating: number
  reviews: number
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
