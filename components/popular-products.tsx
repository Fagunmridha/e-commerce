'use client'

import { ProductGrid } from '@/components/product-grid'
import { useLanguage } from '@/components/language-provider'
import { getPopularProducts } from '@/lib/data'

const POPULAR = getPopularProducts(8)

export function PopularProducts() {
  const { t } = useLanguage()

  return (
    <ProductGrid
      title={t.sections.popularProducts}
      products={POPULAR}
      viewAllHref="/shop"
    />
  )
}
