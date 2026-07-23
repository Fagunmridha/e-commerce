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
  products: Product[]
  categories: Category[]
  getProductById: (id: string) => Product | undefined
  getProductsByCategory: (slug: CategorySlug) => Product[]
  getPopularProducts: (limit?: number) => Product[]
  getRecommendedProducts: (excludeId?: string, limit?: number) => Product[]
  getCategory: (slug: CategorySlug) => Category | undefined
}

const CatalogueContext = createContext<CatalogueValue | null>(null)

export function CatalogueProvider({
  products,
  categories,
  children,
}: {
  products: Product[]
  categories: Category[]
  children: React.ReactNode
}) {
  const value = useMemo<CatalogueValue>(() => {
    const byId = new Map(products.map((product) => [product.id, product]))

    return {
      products,
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
  }, [products, categories])

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
