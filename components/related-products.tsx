'use client'

import { ProductGrid } from '@/components/product-grid'
import { useLanguage } from '@/components/language-provider'
import type { Product } from '@/lib/data'

export function RelatedProducts({
  products,
  viewAllHref,
}: {
  products: Product[]
  viewAllHref: string
}) {
  const { t } = useLanguage()

  if (products.length === 0) return null

  return (
    <ProductGrid
      title={t.sections.youMayAlsoLike}
      products={products}
      viewAllHref={viewAllHref}
    />
  )
}
