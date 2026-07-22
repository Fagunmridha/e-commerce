'use client'

import Link from 'next/link'
import { ProductCard } from '@/components/product-card'
import { useLanguage } from '@/components/language-provider'
import type { Product } from '@/lib/data'

type ProductGridProps = {
  /** Already-translated heading. Pass `countTitle` instead for an "N Products" heading. */
  title?: string
  countTitle?: boolean
  products: Product[]
  viewAllHref?: string
  emptyMessage?: string
}

export function ProductGrid({
  title,
  countTitle = false,
  products,
  viewAllHref,
  emptyMessage,
}: ProductGridProps) {
  const { t } = useLanguage()
  const heading = countTitle
    ? `${products.length} ${t.sections.products}`
    : title

  return (
    <section className="mx-auto max-w-page px-4 pb-16 sm:px-6 lg:px-10">
      {(heading || viewAllHref) && (
        <div className="mb-6 flex items-baseline justify-between gap-4">
          {heading && (
            <h2 className="text-display-sm text-foreground">
              {heading}
            </h2>
          )}
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              {t.sections.viewAll}
            </Link>
          )}
        </div>
      )}

      {products.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {emptyMessage ?? t.sections.noProducts}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}
