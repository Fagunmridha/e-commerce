'use client'

import { createContext, useContext, useMemo } from 'react'
import type { Category, CategorySlug, Product } from '@/lib/types'

/**
 * The catalogue is fetched once from the database in the server root layout and
 * handed to this client context. Client components (cart, product grids, deal
 * countdown…) read products from here instead of importing a hardcoded array,
 * so everything they show traces back to the real database.
 */
type CatalogueValue = {
  /** The store's own stock — what every shop listing and rail renders. */
  products: Product[]
  /**
   * Marketplace listings, shown only under /wholesale/market. Empty unless the
   * viewer is an approved wholesaler: the root layout does not even fetch them
   * otherwise, so an ordinary shopper's page never carries this data.
   */
  wholesaleProducts: Product[]
  /** True when the viewer has an approved shop — gates the trade-only links. */
  isWholesaler: boolean
  categories: Category[]
  /** Looks in both lists, so a marketplace item in the cart still resolves. */
  getProductById: (id: string) => Product | undefined
  getProductsByCategory: (slug: CategorySlug) => Product[]
  getPopularProducts: (limit?: number) => Product[]
  getRecommendedProducts: (excludeId?: string, limit?: number) => Product[]
  getCategory: (slug: CategorySlug) => Category | undefined
}

const CatalogueContext = createContext<CatalogueValue | null>(null)

export function CatalogueProvider({
  products,
  wholesaleProducts,
  isWholesaler,
  categories,
  children,
}: {
  products: Product[]
  wholesaleProducts: Product[]
  isWholesaler: boolean
  categories: Category[]
  children: React.ReactNode
}) {
  const value = useMemo<CatalogueValue>(() => {
    const byId = new Map(
      [...products, ...wholesaleProducts].map((product) => [
        product.id,
        product,
      ]),
    )

    return {
      products,
      wholesaleProducts,
      isWholesaler,
      categories,
      getProductById: (id) => byId.get(id),
      getProductsByCategory: (slug) =>
        products.filter((product) => product.category === slug),
      getPopularProducts: (limit = 8) =>
        products.filter((product) => product.badge).slice(0, limit),
      getRecommendedProducts: (excludeId, limit = 2) =>
        products.filter((product) => product.id !== excludeId).slice(0, limit),
      getCategory: (slug) =>
        categories.find((category) => category.slug === slug),
    }
  }, [products, wholesaleProducts, isWholesaler, categories])

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
