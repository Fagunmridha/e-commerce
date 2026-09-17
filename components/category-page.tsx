'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, useSearchParams } from 'next/navigation'
import { ChevronRight, SlidersHorizontal } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { ProductListCard } from '@/components/product-list-card'
import { CategorySidebar } from '@/components/category-sidebar'
import { ViewToggle, type ViewMode } from '@/components/browse/view-toggle'
import { Reveal } from '@/components/reveal'
import { FeatureBar } from '@/components/feature-bar'
import { Newsletter } from '@/components/newsletter'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useLanguage } from '@/components/language-provider'
import { useCatalogue } from '@/components/catalogue-provider'
import { cn, hasPhoto } from '@/lib/utils'
import { getCategoryDescription } from '@/lib/dictionaries'
import type { CategorySlug } from '@/lib/types'

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'rating'

export function CategoryPage({ slug }: { slug: CategorySlug }) {
  const { t, pick } = useLanguage()
  const {
    products: allProducts,
    getProductsByCategory,
    categories,
    catalogues,
  } = useCatalogue()
  // Looked up in the storefront list rather than through `getCategory`, which
  // resolves trade-only rows too. The route already refuses those server-side;
  // this keeps the second net checking the same thing the first one did.
  const category = categories.find((item) => item.slug === slug)

  // The sidebar can deep-link into a sibling category with its catalogue
  // already picked (`?catalogue=jeans`) — this is the only place that lands,
  // since the target page has not rendered yet to read it any other way.
  const searchParams = useSearchParams()
  const [size, setSize] = useState<string>('all')
  const [catalogue, setCatalogue] = useState(
    () => searchParams.get('catalogue') ?? '',
  )
  const [sort, setSort] = useState<SortKey>('featured')
  const [view, setView] = useState<ViewMode>('grid')
  // The category tree and the size pills both live in one sheet below `lg` —
  // stacking them inline there was the mess this was built to fix.
  const [filtersOpen, setFiltersOpen] = useState(false)

  const all = useMemo(
    () => getProductsByCategory(slug),
    [slug, getProductsByCategory],
  )

  // Sizes come from the catalogue-narrowed list, not the whole category: a
  // "38" that only exists on jeans should not stay on offer once the shopper
  // has switched to shirts.
  const inCatalogue = useMemo(
    () =>
      catalogue ? all.filter((product) => product.catalogue === catalogue) : all,
    [all, catalogue],
  )

  const sizes = useMemo(() => {
    const found = new Set<string>()
    inCatalogue.forEach((product) => product.sizes?.forEach((s) => found.add(s)))
    return [...found]
  }, [inCatalogue])

  const sizeOptions = useMemo(() => ['all', ...sizes], [sizes])
  const activeFilterCount = (catalogue ? 1 : 0) + (size !== 'all' ? 1 : 0)

  const products = useMemo(() => {
    const list =
      size === 'all'
        ? inCatalogue
        : inCatalogue.filter((product) => product.sizes?.includes(size))

    if (sort === 'price-asc') return [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') return [...list].sort((a, b) => b.price - a.price)
    if (sort === 'rating') return [...list].sort((a, b) => b.rating - a.rating)
    return list
  }, [inCatalogue, size, sort])

  if (!category) notFound()

  const name = pick(category.name)
  // The catalogue, once one is picked, takes over the title and the last
  // breadcrumb crumb — "Shirts", not "Men" — the same way a product page's
  // own name outranks its category.
  const activeCatalogueRow = catalogues.find((item) => item.slug === catalogue)
  const heading = activeCatalogueRow ? pick(activeCatalogueRow.name) : name
  const description = getCategoryDescription(t, slug)

  return (
    <>
      <div className="mx-auto max-w-page px-4 pt-6 sm:px-6 lg:px-4">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 text-xs text-muted-foreground"
        >
          <Link href="/" className="transition-colors hover:text-foreground">
            {t.common.home}
          </Link>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          {activeCatalogueRow ? (
            <>
              <Link
                href={`/${slug}`}
                onClick={() => setCatalogue('')}
                className="transition-colors hover:text-foreground"
              >
                {name}
              </Link>
              <ChevronRight className="size-3.5" aria-hidden="true" />
              <span className="text-foreground">{heading}</span>
            </>
          ) : (
            <span className="text-foreground">{name}</span>
          )}
        </nav>

        {/* Title + count on the left, the category's own photo as a short,
            wide card on the right — a banner, but one line tall rather than
            the full-bleed hero this page used to open with. */}
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6">
          <div className="min-w-0 lg:shrink-0">
            <h1 className="text-2xl font-bold tracking-tight text-balance text-foreground sm:text-3xl">
              {heading}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {all.length} {t.category.itemsFound}
            </p>
          </div>

          {hasPhoto(category.image) && (
            <div className="relative h-24 overflow-hidden rounded-xl sm:h-28 lg:h-32 lg:flex-1">
              <Image
                src={category.image}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-center px-5">
                <p className="text-base font-bold text-white sm:text-lg">
                  {name}
                </p>
                {description && (
                  <p className="mt-0.5 line-clamp-1 max-w-sm text-xs text-white/80 sm:text-sm">
                    {description}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-page px-4 py-6 sm:px-6 lg:px-4">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          <CategorySidebar
            className="hidden lg:block"
            categories={categories}
            catalogues={catalogues}
            products={allProducts}
            activeCategory={slug}
            activeCatalogue={catalogue}
            onCatalogueChange={(next) => {
              setCatalogue(next)
              // The chosen size may not exist in the new catalogue, and a
              // filter nothing matches reads as an empty shelf.
              setSize('all')
            }}
          />

          <div className="min-w-0 flex-1">
            {/* Toolbar — one row for every breakpoint. Below `lg` the size
                pills and category tree fold into the "Filters" sheet instead
                of stacking as their own blocks above the grid. */}
            <div className="flex items-center gap-3 border-b border-border pb-5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFiltersOpen(true)}
                className="shrink-0 gap-1.5 lg:hidden"
              >
                <SlidersHorizontal className="size-4" aria-hidden="true" />
                {t.shop.filterTitle}
                {activeFilterCount > 0 && (
                  <span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              <div className="hidden min-w-0 flex-1 flex-wrap items-center gap-2 lg:flex">
                <span className="mr-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  {t.category.filterBy}
                </span>
                <SizePills
                  options={sizeOptions}
                  active={size}
                  onSelect={setSize}
                  allLabel={t.category.allSizes}
                />
              </div>

              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                <label
                  htmlFor="category-sort"
                  className="sr-only shrink-0 text-xs font-bold tracking-wider text-muted-foreground uppercase lg:not-sr-only"
                >
                  {t.shop.sortBy}
                </label>
                <select
                  id="category-sort"
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                  className="h-9 rounded-full border border-border bg-background px-3 text-xs font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:px-4 sm:text-sm sm:font-normal"
                >
                  <option value="featured">{t.shop.sortFeatured}</option>
                  <option value="rating">{t.category.topRated}</option>
                  <option value="price-asc">{t.category.priceLowHigh}</option>
                  <option value="price-desc">{t.category.priceHighLow}</option>
                </select>
                <ViewToggle value={view} onChange={setView} />
              </div>
            </div>

            {/* Grid / List */}
            <div className="py-6">
              {products.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  {t.sections.noProductsInCategory}
                </p>
              ) : view === 'grid' ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {products.map((product, index) => (
                    <Reveal key={product.id} delay={(index % 4) * 80}>
                      <ProductCard product={product} />
                    </Reveal>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map((product, index) => (
                    <Reveal key={product.id} delay={(index % 4) * 80}>
                      <ProductListCard product={product} />
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="left" className="w-full gap-0 overflow-y-auto p-4 sm:max-w-sm">
          <SheetHeader className="px-0 pb-4">
            <SheetTitle>{t.shop.filterTitle}</SheetTitle>
          </SheetHeader>

          <div className="space-y-6">
            <CategorySidebar
              categories={categories}
              catalogues={catalogues}
              products={allProducts}
              activeCategory={slug}
              activeCatalogue={catalogue}
              onCatalogueChange={(next) => {
                setCatalogue(next)
                setSize('all')
                setFiltersOpen(false)
              }}
              showExtras={false}
            />

            <div>
              <h2 className="mb-2 px-1 text-sm font-bold text-foreground">
                {t.category.filterBy}
              </h2>
              <div className="flex flex-wrap gap-2 px-1">
                <SizePills
                  options={sizeOptions}
                  active={size}
                  onSelect={setSize}
                  allLabel={t.category.allSizes}
                />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <FeatureBar />
      <div className="pt-14">
        <Newsletter />
      </div>
    </>
  )
}

/** The size-pill row, shared between the desktop toolbar and the mobile
 * filter sheet so the two can never drift into different pills. */
function SizePills({
  options,
  active,
  onSelect,
  allLabel,
}: {
  options: string[]
  active: string
  onSelect: (value: string) => void
  allLabel: string
}) {
  return (
    <>
      {options.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onSelect(item)}
          aria-pressed={active === item}
          className={cn(
            'shrink-0 rounded-full border px-4 py-1.5 text-xs font-bold tracking-wide uppercase transition-colors',
            active === item
              ? 'border-foreground bg-foreground text-background'
              : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
          )}
        >
          {item === 'all' ? allLabel : item}
        </button>
      ))}
    </>
  )
}
