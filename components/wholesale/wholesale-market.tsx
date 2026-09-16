'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, Filter as FilterIcon, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { Container } from '@/components/layout/container'
import { Reveal } from '@/components/reveal'
import { FeatureBar } from '@/components/feature-bar'
import { ProductCard } from '@/components/product-card'
import { ProductListCard } from '@/components/product-list-card'
import { SortSelect, type SortOption } from '@/components/browse/sort-select'
import { ViewToggle, type ViewMode } from '@/components/browse/view-toggle'
import {
  FilterChips,
  type FilterChip,
} from '@/components/browse/filter-chips'
import { useLanguage } from '@/components/language-provider'
import { useCatalogue } from '@/components/catalogue-provider'
import {
  CatalogueTree,
  UNSORTED,
} from '@/components/wholesale/catalogue-tree'
import { cn, hasPhoto } from '@/lib/utils'
import type { Product } from '@/lib/types'

/** Sorts this page offers. No "featured" — that badge is the store's own, and
 *  a marketplace listing cannot carry it (see `upsertSellerProduct`). */
type SortKey = 'newest' | 'rating' | 'price-asc' | 'price-desc'

const PER_PAGE = 12

/**
 * The market as a joined buyer sees it — the one place trade stock is
 * orderable.
 *
 * Laid out like `/shop`: a filter sidebar, a sort and a view switch, chips for
 * whatever is narrowing the grid, and load-more. It used to be a search box,
 * two dropdowns and a bare grid, which made the page a shopper actually buys
 * from the plainest one on the site.
 *
 * There is no "sell your own stock" call to action here. A seller cannot reach
 * this page at all (the gate in the route's layout turns them away), so the
 * only person reading it chose the buying side and cannot list anything.
 */
export function WholesaleMarket() {
  const { t, pick } = useLanguage()
  // The trade list, not the storefront one: this page sells to wholesale
  // buyers, and a shop aisle that is closed to trade has no filter here.
  const {
    wholesaleProducts,
    wholesaleCategories: categories,
    catalogues,
  } = useCatalogue()
  const copy = t.wholesale.market

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [catalogue, setCatalogue] = useState('')
  const [sort, setSort] = useState<SortKey>('newest')
  const [view, setView] = useState<ViewMode>('grid')
  const [shown, setShown] = useState(PER_PAGE)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const sortOptions: SortOption<SortKey>[] = [
    { value: 'newest', label: t.shop.sortNewest },
    { value: 'rating', label: t.shop.sortRating },
    { value: 'price-asc', label: t.shop.sortPriceAsc },
    { value: 'price-desc', label: t.shop.sortPriceDesc },
  ]

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    const matched = wholesaleProducts.filter(
      (product) =>
        (!category || product.category === category) &&
        // The tree's "Others" row selects a sentinel, not a catalogue slug.
        (!catalogue ||
          (catalogue === UNSORTED
            ? !product.catalogue
            : product.catalogue === catalogue)) &&
        // Product names only. The shop behind a listing is never shown to a
        // buyer, so searching by it would leak the very thing that is hidden.
        (!term || pick(product.name).toLowerCase().includes(term)),
    )

    // Copied before sorting — the provider's array is shared with every other
    // page reading this context, and `sort` mutates in place.
    const ordered = [...matched]
    switch (sort) {
      case 'price-asc':
        return ordered.sort((a, b) => a.price - b.price)
      case 'price-desc':
        return ordered.sort((a, b) => b.price - a.price)
      case 'rating':
        return ordered.sort((a, b) => b.rating - a.rating)
      default:
        // `wholesaleProducts` already arrives newest first.
        return ordered
    }
  }, [wholesaleProducts, search, category, catalogue, sort, pick])

  /** The catalogues of the picked category — the chip row under the title. */
  const chipCatalogues = useMemo(() => {
    if (!category) return []
    return catalogues.filter((entry) => entry.categorySlug === category)
  }, [catalogues, category])

  const categoryRow = categories.find((entry) => entry.slug === category)

  const clearAll = () => {
    setSearch('')
    setCategory('')
    setCatalogue('')
  }

  const filterChips: FilterChip[] = [
    categoryRow && {
      key: 'category',
      label: `${t.catalogue.category}: ${pick(categoryRow.name)}`,
      onClear: () => {
        setCategory('')
        setCatalogue('')
      },
    },
    catalogue && {
      key: 'catalogue',
      label: `${t.catalogue.catalogue}: ${
        catalogue === UNSORTED
          ? t.wholesale.landing.otherCatalogue
          : (() => {
              const match = catalogues.find((c) => c.slug === catalogue)
              return match ? pick(match.name) : catalogue
            })()
      }`,
      onClear: () => setCatalogue(''),
    },
    search.trim() && {
      key: 'search',
      label: `${t.shop.searchPlaceholder}: “${search.trim()}”`,
      onClear: () => setSearch(''),
    },
  ].filter(Boolean) as FilterChip[]

  const sidebar = (
    <CatalogueTree
      categories={categories}
      catalogues={catalogues}
      products={wholesaleProducts}
      category={category}
      catalogue={catalogue}
      onCategoryChange={(slug) => {
        setCategory(slug)
        setShown(PER_PAGE)
      }}
      onCatalogueChange={(slug) => {
        setCatalogue(slug)
        setShown(PER_PAGE)
      }}
    />
  )

  return (
    <>
      <section className="border-b border-border bg-muted/50">
        <Container className="py-8 sm:py-10">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1 text-xs text-muted-foreground"
          >
            <Link href="/" className="transition-colors hover:text-primary">
              {t.common.home}
            </Link>
            <ChevronRight className="size-3.5" aria-hidden="true" />
            <Link
              href="/wholesale"
              className="transition-colors hover:text-primary"
            >
              {t.pages.wholesale.breadcrumb}
            </Link>
          </nav>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                {copy.badge}
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-balance text-foreground sm:text-3xl">
                {categoryRow ? pick(categoryRow.name) : copy.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {t.shop.showingProducts
                  .replace('{shown}', String(visible.length))
                  .replace('{total}', String(wholesaleProducts.length))}
              </p>
            </div>

            {/* The picked category's own picture, where the admin uploaded one.
                Never invented artwork — a line with no photograph simply has no
                banner, which is why this is a conditional and not a fallback. */}
            {categoryRow && hasPhoto(categoryRow.image) && (
              <div className="relative hidden h-24 w-80 shrink-0 overflow-hidden rounded-xl lg:block">
                <Image
                  src={categoryRow.image}
                  alt=""
                  fill
                  sizes="320px"
                  className="object-cover"
                />
              </div>
            )}
          </div>

          {/* The reference's "সব শার্ট / ফুল স্লিভ / …" row: the catalogues of
              whichever category is open. Nothing to show until one is. */}
          {chipCatalogues.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              <CatalogueChip
                label={t.catalogue.allCatalogues}
                active={!catalogue}
                onClick={() => setCatalogue('')}
              />
              {chipCatalogues.map((entry) => (
                <CatalogueChip
                  key={entry.slug}
                  label={pick(entry.name)}
                  active={catalogue === entry.slug}
                  onClick={() => {
                    setCatalogue(entry.slug)
                    setShown(PER_PAGE)
                  }}
                />
              ))}
            </div>
          )}
        </Container>
      </section>

      <Container className="py-8 sm:py-10">
        {wholesaleProducts.length === 0 ? (
          <Empty className="rounded-xl border border-border">
            <EmptyHeader>
              <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
              <EmptyDescription>{copy.emptyBody}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative max-w-md flex-1">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value)
                    setShown(PER_PAGE)
                  }}
                  placeholder={copy.search}
                  className="pl-9"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label={t.common.close}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                {/* Below lg the sidebar is not on screen, so this is the only
                    way to the tree — hence a button rather than a toggle. */}
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  className="flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-xs font-semibold lg:hidden"
                >
                  <FilterIcon className="size-4" />
                  <span>{t.shop.filterTitle}</span>
                  {filterChips.length > 0 && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                      {filterChips.length}
                    </span>
                  )}
                </button>

                <SortSelect
                  id="market-sort"
                  value={sort}
                  options={sortOptions}
                  onChange={setSort}
                />
                <ViewToggle value={view} onChange={setView} />
              </div>
            </div>

            <FilterChips chips={filterChips} onClearAll={clearAll} />

            <div className="flex flex-col gap-8 lg:flex-row">
              <aside className="hidden w-64 shrink-0 lg:block">{sidebar}</aside>

              <div className="min-w-0 flex-1">
                {visible.length === 0 ? (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    {copy.noResults}
                  </p>
                ) : (
                  <>
                    <div
                      className={cn(
                        // Two up even on a phone, and the count climbs only
                        // once the sidebar has stopped eating the width — at
                        // `lg` it appears, so the next step waits for `xl`.
                        view === 'grid'
                          ? 'grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4'
                          : 'flex flex-col gap-4',
                      )}
                    >
                      {visible.slice(0, shown).map((product, index) => (
                        <Reveal key={product.id} delay={(index % 4) * 60}>
                          <Listing product={product} view={view} />
                        </Reveal>
                      ))}
                    </div>

                    {shown < visible.length && (
                      <div className="mt-10 text-center">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => setShown((n) => n + PER_PAGE)}
                        >
                          {t.shop.loadMore}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </Container>

      <FeatureBar />

      {/* The same tree, not a second hand-written copy of it — `ShopBrowser`
          duplicates its sidebar into its drawer and the two have already
          drifted apart. */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t.common.close}
            onClick={() => setFiltersOpen(false)}
            className="absolute inset-0 bg-foreground/40"
          />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-xs flex-col bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">{t.shop.filterTitle}</p>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label={t.common.close}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{sidebar}</div>
            <div className="border-t border-border p-4">
              <Button
                className="w-full"
                onClick={() => setFiltersOpen(false)}
              >
                {t.shop.filterTitle}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function CatalogueChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-foreground hover:border-primary/40',
      )}
    >
      {label}
    </button>
  )
}

/**
 * One listing, plus the caption that stands in for a shop name.
 *
 * Deliberately neutral. The buyer is trading with the store, and which shop
 * supplied the goods is not theirs to know — see `fetchWholesaleProducts` in
 * lib/products.ts, which does not even select the name.
 */
function Listing({ product, view }: { product: Product; view: ViewMode }) {
  const { t } = useLanguage()

  return (
    <div className="flex h-full flex-col">
      {view === 'grid' ? (
        <ProductCard product={product} />
      ) : (
        <ProductListCard product={product} />
      )}
      <p className="mt-1.5 truncate px-1 text-xs text-muted-foreground">
        {t.wholesale.market.soldByStore}
      </p>
    </div>
  )
}
