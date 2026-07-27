'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { Reveal } from '@/components/reveal'
import { FeatureBar } from '@/components/feature-bar'
import { Newsletter } from '@/components/newsletter'
import { useLanguage } from '@/components/language-provider'
import { useCatalogue } from '@/components/catalogue-provider'
import { cn } from '@/lib/utils'
import type { CategorySlug } from '@/lib/types'

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'rating'

/** Editorial banner colour per category, matching the hero slides. */
const BANNER_TINT: Record<CategorySlug, string> = {
  men: 'bg-[#1e3a5f]',
  women: 'bg-[#7c2d4a]',
  kids: 'bg-[#b45309]',
  accessories: 'bg-[#0f172a]',
}

export function CategoryPage({ slug }: { slug: CategorySlug }) {
  const { t, pick } = useLanguage()
  const { getCategory, getProductsByCategory } = useCatalogue()
  const category = getCategory(slug)

  const [size, setSize] = useState<string>('all')
  const [sort, setSort] = useState<SortKey>('featured')

  const all = useMemo(
    () => getProductsByCategory(slug),
    [slug, getProductsByCategory],
  )

  const sizes = useMemo(() => {
    const found = new Set<string>()
    all.forEach((product) => product.sizes?.forEach((s) => found.add(s)))
    return [...found]
  }, [all])

  const products = useMemo(() => {
    const list =
      size === 'all' ? all : all.filter((product) => product.sizes?.includes(size))

    if (sort === 'price-asc') return [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') return [...list].sort((a, b) => b.price - a.price)
    if (sort === 'rating') return [...list].sort((a, b) => b.rating - a.rating)
    return list
  }, [all, size, sort])

  if (!category) notFound()

  const name = pick(category.name)

  return (
    <>
      {/* Banner */}
      <section className={cn('relative overflow-hidden', BANNER_TINT[slug])}>
        <img
          src={category.image}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover opacity-25"
        />
        <div className="relative mx-auto max-w-page px-4 py-16 sm:px-6 lg:px-4 lg:py-24">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex items-center gap-1 text-xs text-white/70"
          >
            <Link href="/" className="transition-colors hover:text-white">
              {t.common.home}
            </Link>
            <ChevronRight className="size-3.5" />
            <span className="text-white">{name}</span>
          </nav>

          <h1 className="text-display-sm text-white sm:text-display">{name}</h1>
          <p className="mt-4 max-w-xl text-sm text-white/75 sm:text-base">
            {t.categoryDescriptions[slug]}
          </p>
          <p className="mt-6 inline-flex items-center rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold tracking-wide text-white uppercase backdrop-blur">
            {all.length} {t.category.itemsFound}
          </p>
        </div>
      </section>

      {/* Toolbar */}
      <div className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-page flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
              {t.category.filterBy}
            </span>
            <button
              onClick={() => setSize('all')}
              aria-pressed={size === 'all'}
              className={cn(
                'rounded-full border px-4 py-1.5 text-xs font-bold tracking-wide uppercase transition-colors',
                size === 'all'
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
              )}
            >
              {t.category.allSizes}
            </button>
            {sizes.map((item) => (
              <button
                key={item}
                onClick={() => setSize(item)}
                aria-pressed={size === item}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-xs font-bold tracking-wide uppercase transition-colors',
                  size === item
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
                )}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="category-sort"
              className="shrink-0 text-xs font-bold tracking-wider text-muted-foreground uppercase"
            >
              {t.shop.sortBy}
            </label>
            <select
              id="category-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="h-9 rounded-full border border-border bg-background px-4 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="featured">{t.shop.sortFeatured}</option>
              <option value="rating">{t.category.topRated}</option>
              <option value="price-asc">{t.category.priceLowHigh}</option>
              <option value="price-desc">{t.category.priceHighLow}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-4">
        {products.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {t.sections.noProductsInCategory}
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

      <FeatureBar />
      <div className="pt-14">
        <Newsletter />
      </div>
    </>
  )
}
