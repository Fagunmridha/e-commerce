'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProductCard } from '@/components/product-card'
import { Reveal } from '@/components/reveal'
import { useLanguage } from '@/components/language-provider'
import { useCatalogue } from '@/components/catalogue-provider'
import { cn } from '@/lib/utils'
import type { CategorySlug } from '@/lib/types'

type Filter = CategorySlug | 'all'
type SortKey = 'featured' | 'price-asc' | 'price-desc'

export function ShopBrowser({ initialFilter = 'all' }: { initialFilter?: Filter }) {
  const { t, pick } = useLanguage()
  const { products: allProducts, categories } = useCatalogue()
  const searchParams = useSearchParams()
  const query = (searchParams.get('q') ?? '').trim().toLowerCase()
  const [filter, setFilter] = useState<Filter>(initialFilter)
  const [sort, setSort] = useState<SortKey>('featured')

  const products = useMemo(() => {
    let list =
      filter === 'all'
        ? allProducts
        : allProducts.filter((product) => product.category === filter)

    if (query) {
      list = list.filter(
        (product) =>
          product.name.en.toLowerCase().includes(query) ||
          product.name.bn.toLowerCase().includes(query),
      )
    }

    if (sort === 'price-asc') return [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') return [...list].sort((a, b) => b.price - a.price)
    return list
  }, [filter, sort, query, allProducts])

  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: t.shop.all },
    ...categories.map((category) => ({
      value: category.slug as Filter,
      label: pick(category.name),
    })),
  ]

  const sortOptions: { value: SortKey; label: string }[] = [
    { value: 'featured', label: t.shop.sortFeatured },
    { value: 'price-asc', label: t.shop.sortPriceAsc },
    { value: 'price-desc', label: t.shop.sortPriceDesc },
  ]

  return (
    <div className="py-10">
      <div className="mx-auto mb-8 flex max-w-page flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              aria-pressed={filter === item.value}
              className={cn(
                'rounded-full border px-5 py-2 text-xs font-bold tracking-wide uppercase transition-colors',
                filter === item.value
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="shrink-0 text-sm text-muted-foreground">
            {t.shop.sortBy}
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="mx-auto max-w-page px-4 pb-16 sm:px-6 lg:px-10">
        <p className="mb-6 text-sm text-muted-foreground">
          {products.length} {t.category.itemsFound}
        </p>
        {products.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {t.sections.noProductsForFilter}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product, index) => (
              <Reveal key={product.id} delay={(index % 4) * 80}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
