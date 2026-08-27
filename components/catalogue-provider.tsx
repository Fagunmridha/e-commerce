'use client'

import { createContext, useContext, useMemo } from 'react'
import type {
  Catalogue,
  CatalogueSlug,
  Category,
  CategorySlug,
  Product,
} from '@/lib/types'

/**
 * The catalogue is fetched once from the database in the server root layout and
 * handed to this client context. Client components (cart, product grids, deal
 * countdown…) read products from here instead of importing a hardcoded array,
 * so everything they show traces back to the real database.
 */
type CatalogueValue = {
  /**
   * The store's own shelf stock — what every shop listing and rail renders.
   * Pre-order rows are filtered out here rather than at each call site, so a
   * Coming Soon product cannot leak into a grid whose only button is "Add to
   * Cart". They are still reachable through `getProductById`, which is what
   * keeps a booked line in the cart resolving.
   */
  products: Product[]
  /** Upcoming stock, for the Coming Soon rail. Soonest delivery first. */
  preorderProducts: Product[]
  /**
   * Marketplace listings, shown only under /wholesale/market. Empty unless the
   * viewer is an approved wholesaler: the root layout does not even fetch them
   * otherwise, so an ordinary shopper's page never carries this data.
   */
  wholesaleProducts: Product[]
  /** True when the viewer has an approved shop — gates the trade-only links. */
  isWholesaler: boolean
  categories: Category[]
  /** Every catalogue in the store, already in display order. */
  catalogues: Catalogue[]
  /** Looks in both lists, so a marketplace item in the cart still resolves. */
  getProductById: (id: string) => Product | undefined
  getProductsByCategory: (slug: CategorySlug) => Product[]
  /** The catalogues hanging under one category, for its dropdown. */
  getCataloguesFor: (slug: CategorySlug) => Catalogue[]
  /**
   * Shelf stock in one catalogue. Products with no catalogue never match —
   * an uncatalogued item belongs under "All", not under an arbitrary branch.
   */
  getProductsByCatalogue: (slug: CatalogueSlug) => Product[]
  getPopularProducts: (limit?: number) => Product[]
  getRecommendedProducts: (excludeId?: string, limit?: number) => Product[]
  getCategory: (slug: CategorySlug) => Category | undefined
}

const CatalogueContext = createContext<CatalogueValue | null>(null)

export function CatalogueProvider({
  products,
  preorderProducts,
  wholesaleProducts,
  isWholesaler,
  categories,
  catalogues,
  children,
}: {
  products: Product[]
  /** Carries the booked counts, which the catalogue-wide query does not. */
  preorderProducts: Product[]
  wholesaleProducts: Product[]
  isWholesaler: boolean
  categories: Category[]
  catalogues: Catalogue[]
  children: React.ReactNode
}) {
  const value = useMemo<CatalogueValue>(() => {
    // Lookups still see everything: a pre-ordered line in the cart has to
    // resolve to its product, and so does the Coming Soon card itself.
    // `preorderProducts` is listed last so its richer rows (they carry the
    // booked count) win over the same ids coming from the catalogue query.
    const byId = new Map(
      [...products, ...wholesaleProducts, ...preorderProducts].map(
        (product) => [product.id, product],
      ),
    )

    const shelf = products.filter((product) => !product.preorder)

    return {
      products: shelf,
      preorderProducts,
      wholesaleProducts,
      isWholesaler,
      categories,
      catalogues,
      getProductById: (id) => byId.get(id),
      getProductsByCategory: (slug) =>
        shelf.filter((product) => product.category === slug),
      getCataloguesFor: (slug) =>
        catalogues.filter((item) => item.categorySlug === slug),
      getProductsByCatalogue: (slug) =>
        shelf.filter((product) => product.catalogue === slug),
      getPopularProducts: (limit = 8) =>
        shelf.filter((product) => product.badge).slice(0, limit),
      getRecommendedProducts: (excludeId, limit = 2) =>
        shelf.filter((product) => product.id !== excludeId).slice(0, limit),
      getCategory: (slug) =>
        categories.find((category) => category.slug === slug),
    }
  }, [
    products,
    preorderProducts,
    wholesaleProducts,
    isWholesaler,
    categories,
    catalogues,
  ])

  return (
    <CatalogueContext.Provider value={value}>
      {children}
    </CatalogueContext.Provider>
  )
}

export function useCatalogue(): CatalogueValue {
  const context = useContext(CatalogueContext)
  if (!context) {
    throw new Error('useCatalogue must be used inside <CatalogueProvider>')
  }
  return context
}
