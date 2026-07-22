'use client'

import { useMemo, useState } from 'react'
import { ProductGrid } from '@/components/product-grid'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'
import { CATEGORIES, PRODUCTS, type CategorySlug } from '@/lib/data'

type Filter = CategorySlug | 'all'
type SortKey = 'featured' | 'price-asc' | 'price-desc'

export function ShopBrowser({ initialFilter = 'all' }: { initialFilter?: Filter }) {
  const { t, pick } = useLanguage()
  const [filter, setFilter] = useState<Filter>(initialFilter)
  const [sort, setSort] = useState<SortKey>('featured')

  const products = useMemo(() => {
    const list =
      filter === 'all'
        ? PRODUCTS
        : PRODUCTS.filter((product) => product.category === filter)

    if (sort === 'price-asc') return [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') return [...list].sort((a, b) => b.price - a.price)
    return list
  }, [filter, sort])

  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: t.shop.all },
    ...CATEGORIES.map((category) => ({
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
      <div className="mx-auto mb-8 flex max-w-7xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              aria-pressed={filter === item.value}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                filter === item.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-foreground hover:border-primary hover:text-primary',
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

      <ProductGrid
        countTitle
        products={products}
        emptyMessage={t.sections.noProductsForFilter}
      />
    </div>
  )
}
