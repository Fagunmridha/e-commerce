'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
import {
  MarketFilterPanel,
  type AttributeFacet,
  type ColourOption,
  type FacetOption,
} from '@/components/wholesale/market-filters'
import { useLanguage } from '@/components/language-provider'
import { useCatalogue } from '@/components/catalogue-provider'
import {
  EMPTY_FILTERS,
  UNSORTED,
  activeFilterCount,
  colourKey,
  countValues,
  matchesFilters,
  type AttributeAnswers,
  type FacetKey,
  type MarketFilters,
} from '@/lib/wholesale/market-filters'
import { cn, hasPhoto } from '@/lib/utils'
import type { AttributeDefinition } from '@/lib/attribute-tree'
import type { Product } from '@/lib/types'

/** What the server hands down for the admin-defined filters (Brand, Fabric…). */
export type MarketFacetData = {
  definitions: AttributeDefinition[]
  values: AttributeAnswers
}

type SortKey = 'popular' | 'newest' | 'price-asc' | 'price-desc'

const PER_PAGE = 12
/** Circles shown before the "More" circle. */
const CIRCLES = 6
/** Garment sizes in the order a person reads them, not the alphabet. */
const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']

function compareSizes(a: string, b: string): number {
  const ia = SIZE_ORDER.indexOf(a.toUpperCase())
  const ib = SIZE_ORDER.indexOf(b.toUpperCase())
  if (ia !== -1 && ib !== -1) return ia - ib
  if (ia !== -1) return -1
  if (ib !== -1) return 1
  const na = Number(a)
  const nb = Number(b)
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb
  return a.localeCompare(b)
}

/**
 * The market as a joined buyer sees it — the one place trade stock is ordered.
 *
 * Laid out as a proper catalogue page: the filter panel down the left; a banner,
 * a row of category circles and the toolbar above the grid on the right. Every
 * part is drawn from data — the banner photograph is the category's own, the
 * circles use a real listing's photo, and a filter appears only when some
 * listing on sale supports it — so nothing on it is decoration an admin did not
 * put there.
 *
 * A seller never reaches this page: the route's layout turns them away. The two
 * sides are exclusive, and a shop does not buy from the market it sells into.
 */
export function WholesaleMarket({ facets }: { facets: MarketFacetData }) {
  const { t, pick } = useLanguage()
  const {
    wholesaleProducts: products,
    wholesaleCategories: categories,
    catalogues,
  } = useCatalogue()
  const copy = t.wholesale.market

  const [filters, setFilters] = useState<MarketFilters>(EMPTY_FILTERS)
  const [sort, setSort] = useState<SortKey>('popular')
  const [view, setView] = useState<ViewMode>('grid')
  const [shown, setShown] = useState(PER_PAGE)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Any change to what is filtered starts the list from its top again.
  const update = (patch: Partial<MarketFilters>) => {
    setFilters((current) => ({ ...current, ...patch }))
    setShown(PER_PAGE)
  }
  const reset = () => {
    setFilters(EMPTY_FILTERS)
    setShown(PER_PAGE)
  }

  const context = useMemo(
    () => ({ pick, answers: facets.values }),
    [pick, facets.values],
  )

  const visible = useMemo(() => {
    const matched = products.filter((product) =>
      matchesFilters(product, filters, context),
    )
    // Copied first: the provider's array is shared with every other reader of
    // the context, and `sort` works in place.
    const ordered = [...matched]
    switch (sort) {
      case 'price-asc':
        return ordered.sort((a, b) => a.price - b.price)
      case 'price-desc':
        return ordered.sort((a, b) => b.price - a.price)
      case 'newest':
        // Already newest-first from the query.
        return ordered
      default:
        // Most reviewed first, then best rated — what "popular" can honestly
        // mean without a sales figure the buyer is not shown.
        return ordered.sort(
          (a, b) => b.reviews - a.reviews || b.rating - a.rating,
        )
    }
  }, [products, filters, context, sort])

  /** The listings that pass every filter but one — a facet's own count base. */
  const passingAllBut = (skip: FacetKey) =>
    products.filter((product) => matchesFilters(product, filters, context, skip))

  const sizes: FacetOption[] = useMemo(() => {
    const counts = countValues(passingAllBut('size'), (p) => p.sizes)
    // A ticked size stays listed at 0, or there would be no way to untick it.
    for (const size of filters.sizes) if (!counts.has(size)) counts.set(size, 0)
    return [...counts.entries()]
      .sort(([a], [b]) => compareSizes(a, b))
      .map(([value, count]) => ({ value, label: value, count }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, filters, context])

  const colours: ColourOption[] = useMemo(() => {
    const names = new Map<string, { label: string; hex?: string }>()
    for (const product of products) {
      for (const colour of product.colors ?? []) {
        const key = colourKey(colour.name)
        const known = names.get(key)
        if (!known) names.set(key, { label: pick(colour.name), hex: colour.hex })
        else if (!known.hex && colour.hex) known.hex = colour.hex
      }
    }
    const counts = countValues(passingAllBut('colour'), (p) =>
      p.colors?.map((colour) => colourKey(colour.name)),
    )
    return [...names.entries()]
      .map(([value, meta]) => ({ value, ...meta, count: counts.get(value) ?? 0 }))
      .filter((option) => option.count > 0 || filters.colours.includes(option.value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, filters, context, pick])

  const attributes: AttributeFacet[] = useMemo(
    () =>
      facets.definitions
        .map((definition) => {
          const counts = countValues(
            passingAllBut(`attribute:${definition.id}`),
            (p) => {
              const answer = facets.values[p.id]?.[definition.id]
              return answer ? [answer] : []
            },
          )
          const ticked = filters.attributes[definition.id] ?? []
          return {
            id: definition.id,
            label: definition.label,
            // In the admin's own option order, not by count — a list that
            // re-sorts itself under the pointer is one nobody can click.
            options: definition.options
              .map((option) => ({
                value: option.en,
                label: pick(option),
                count: counts.get(option.en) ?? 0,
              }))
              .filter(
                (option) => option.count > 0 || ticked.includes(option.value),
              ),
          }
        })
        // A field no listing on sale has answered is not a filter yet.
        .filter((facet) => facet.options.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [facets, products, filters, context, pick],
  )

  const priceBounds = useMemo<[number, number]>(() => {
    if (products.length === 0) return [0, 0]
    const prices = products.map((product) => product.price)
    return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))]
  }, [products])

  // Offer and stock filters only where they can change something.
  const showOffers =
    filters.offersOnly ||
    products.some((p) => p.oldPrice !== undefined && p.oldPrice > p.price)
  const showStock =
    filters.inStockOnly ||
    (products.some((p) => p.stock <= 0) && products.some((p) => p.stock > 0))

  const selectedCategory = categories.find((c) => c.slug === filters.category)

  const chips: FilterChip[] = [
    selectedCategory && {
      key: 'category',
      label: `${t.catalogue.category}: ${pick(selectedCategory.name)}`,
      onClear: () => update({ category: '', catalogue: '' }),
    },
    filters.catalogue && {
      key: 'catalogue',
      label: `${t.catalogue.catalogue}: ${
        filters.catalogue === UNSORTED
          ? t.wholesale.landing.otherCatalogue
          : (() => {
              const match = catalogues.find((c) => c.slug === filters.catalogue)
              return match ? pick(match.name) : filters.catalogue
            })()
      }`,
      onClear: () => update({ catalogue: '' }),
    },
    filters.search.trim() && {
      key: 'search',
      label: `“${filters.search.trim()}”`,
      onClear: () => update({ search: '' }),
    },
    ...filters.sizes.map((size) => ({
      key: `size:${size}`,
      label: `${copy.size}: ${size}`,
      onClear: () => update({ sizes: filters.sizes.filter((s) => s !== size) }),
    })),
    ...filters.colours.map((colour) => ({
      key: `colour:${colour}`,
      label: `${copy.colour}: ${colours.find((c) => c.value === colour)?.label ?? colour}`,
      onClear: () =>
        update({ colours: filters.colours.filter((c) => c !== colour) }),
    })),
    filters.price && {
      key: 'price',
      label: `${copy.price}: ৳${filters.price[0]} – ৳${filters.price[1]}`,
      onClear: () => update({ price: null }),
    },
    ...Object.entries(filters.attributes).flatMap(([id, values]) => {
      const definition = facets.definitions.find((d) => d.id === id)
      return values.map((value) => ({
        key: `attribute:${id}:${value}`,
        label: `${definition ? pick(definition.label) : id}: ${value}`,
        onClear: () =>
          update({
            attributes: {
              ...filters.attributes,
              [id]: values.filter((v) => v !== value),
            },
          }),
      }))
    }),
    filters.offersOnly && {
      key: 'offers',
      label: copy.onlyOffers,
      onClear: () => update({ offersOnly: false }),
    },
    filters.inStockOnly && {
      key: 'stock',
      label: copy.onlyInStock,
      onClear: () => update({ inStockOnly: false }),
    },
  ].filter(Boolean) as FilterChip[]

  const sortOptions: SortOption<SortKey>[] = [
    { value: 'popular', label: copy.sortPopular },
    { value: 'newest', label: t.shop.sortNewest },
    { value: 'price-asc', label: t.shop.sortPriceAsc },
    { value: 'price-desc', label: t.shop.sortPriceDesc },
  ]

  const panel = (
    <MarketFilterPanel
      filters={filters}
      update={update}
      onReset={reset}
      categories={categories}
      catalogues={catalogues}
      products={products}
      sizes={sizes}
      colours={colours}
      attributes={attributes}
      priceBounds={priceBounds}
      showOffers={showOffers}
      showStock={showStock}
    />
  )

  return (
    <>
      <Container className="py-6 sm:py-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex items-center gap-1 text-xs text-muted-foreground"
        >
          <Link href="/" className="transition-colors hover:text-primary">
            {t.common.home}
          </Link>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <Link
            href="/wholesale"
            className={cn(
              'transition-colors hover:text-primary',
              !selectedCategory && 'text-foreground',
            )}
          >
            {t.pages.wholesale.breadcrumb}
          </Link>
          {selectedCategory && (
            <>
              <ChevronRight className="size-3.5" aria-hidden="true" />
              <span className="text-foreground">{pick(selectedCategory.name)}</span>
            </>
          )}
        </nav>

        {products.length === 0 ? (
          <Empty className="rounded-2xl border border-border">
            <EmptyHeader>
              <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
              <EmptyDescription>{copy.emptyBody}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
            {/* Sticky, so the filters stay in reach down a long grid. Its own
                scroll if the panel is taller than the screen. */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
                {panel}
              </div>
            </aside>

            <div className="min-w-0 space-y-6">
              <Banner
                title={selectedCategory ? pick(selectedCategory.name) : copy.title}
                subtitle={copy.subtitle}
                count={copy.found.replace('{n}', String(visible.length))}
                image={
                  selectedCategory && hasPhoto(selectedCategory.image)
                    ? selectedCategory.image
                    : undefined
                }
              />

              <CategoryCircles
                products={products}
                filters={filters}
                update={update}
              />

              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <p className="text-sm font-semibold text-foreground">
                  {copy.results.replace('{n}', String(visible.length))}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    className="lg:hidden"
                    onClick={() => setSheetOpen(true)}
                  >
                    <SlidersHorizontal className="size-4" aria-hidden="true" />
                    {t.shop.filterTitle}
                    {activeFilterCount(filters) > 0 && (
                      <span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">
                        {activeFilterCount(filters)}
                      </span>
                    )}
                  </Button>
                  <SortSelect
                    id="market-sort"
                    value={sort}
                    options={sortOptions}
                    onChange={setSort}
                  />
                  <ViewToggle value={view} onChange={setView} />
                </div>
              </div>

              <FilterChips chips={chips} onClearAll={reset} />

              {visible.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
                  <p className="text-sm text-muted-foreground">{copy.noResults}</p>
                  <Button variant="outline" className="mt-4" onClick={reset}>
                    {copy.resetFilters}
                  </Button>
                </div>
              ) : (
                <>
                  <div
                    className={
                      view === 'grid'
                        ? 'grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4'
                        : 'flex flex-col gap-4'
                    }
                  >
                    {visible.slice(0, shown).map((product, index) => (
                      <Reveal key={product.id} delay={(index % 4) * 60}>
                        <Listing product={product} view={view} />
                      </Reveal>
                    ))}
                  </div>

                  {shown < visible.length && (
                    <div className="text-center">
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
        )}
      </Container>

      <FeatureBar />

      {/* The same panel, not a second copy of it. */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-full max-w-sm overflow-y-auto p-4">
          <SheetHeader className="px-0">
            <SheetTitle>{t.shop.filterTitle}</SheetTitle>
          </SheetHeader>
          {panel}
        </SheetContent>
      </Sheet>
    </>
  )
}

/**
 * The page's banner: the open category's name over the market's line, with a
 * count, and the category's own photograph beside it when it has one.
 *
 * Without a photograph the banner is the tinted panel alone — no stock image
 * stands in, because a stranger's face over "Electronics" is exactly the kind
 * of decoration that makes a trade site look like a template.
 */
function Banner({
  title,
  subtitle,
  count,
  image,
}: {
  title: string
  subtitle: string
  count: string
  image?: string
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-accent via-accent/70 to-primary/10">
      {image && (
        <div className="absolute inset-y-0 right-0 hidden w-1/2 sm:block">
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 1024px) 50vw, 480px"
            className="object-cover"
            priority
          />
          {/* Fades the photograph into the panel so the words never sit on a
              busy edge. */}
          <div className="absolute inset-0 bg-gradient-to-r from-accent via-accent/40 to-transparent" />
        </div>
      )}
      <div
        className={cn(
          'relative flex min-h-40 flex-col justify-center px-6 py-7 sm:px-8',
          image && 'sm:max-w-[60%]',
        )}
      >
        <h1 className="text-2xl font-bold tracking-tight text-balance text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 line-clamp-2 max-w-md text-sm text-muted-foreground">
          {subtitle}
        </p>
        <span className="mt-4 w-fit rounded-full bg-primary px-3.5 py-1 text-xs font-semibold text-primary-foreground">
          {count}
        </span>
      </div>
    </section>
  )
}

type Circle = {
  key: string
  label: string
  count: number
  image?: string
  active: boolean
  onSelect: () => void
}

/**
 * The row of round shortcuts under the banner.
 *
 * With no category open it offers categories; inside one, that category's
 * catalogues. Each circle's picture is a real listing's photograph from inside
 * it — catalogues have no image of their own, and a borrowed product shot says
 * what is in there more honestly than an icon would.
 */
function CategoryCircles({
  products,
  filters,
  update,
}: {
  products: Product[]
  filters: MarketFilters
  update: (patch: Partial<MarketFilters>) => void
}) {
  const { t, pick } = useLanguage()
  const { wholesaleCategories: categories, catalogues } = useCatalogue()
  const copy = t.wholesale.market
  const [expanded, setExpanded] = useState(false)

  const photoOf = (list: Product[]) =>
    list.find((product) => hasPhoto(product.image))?.image

  const circles: Circle[] = useMemo(() => {
    if (filters.category) {
      const inCategory = products.filter((p) => p.category === filters.category)
      const rows = catalogues
        .filter((entry) => entry.categorySlug === filters.category)
        .map((entry) => {
          const inside = inCategory.filter((p) => p.catalogue === entry.slug)
          return {
            key: entry.slug,
            label: pick(entry.name),
            count: inside.length,
            image: photoOf(inside),
            active: filters.catalogue === entry.slug,
            onSelect: () =>
              update({
                catalogue: filters.catalogue === entry.slug ? '' : entry.slug,
              }),
          }
        })
        .filter((circle) => circle.count > 0)
      if (rows.length === 0) return []
      return [
        {
          key: '__all__',
          label: copy.all,
          count: inCategory.length,
          image: photoOf(inCategory),
          active: !filters.catalogue,
          onSelect: () => update({ catalogue: '' }),
        },
        ...rows,
      ]
    }

    // No category open: every category that holds stock, whichever line it
    // sits in. A grouping line with children is not itself a destination.
    const parents = new Set(categories.map((c) => c.parentSlug).filter(Boolean))
    return categories
      .filter((category) => !parents.has(category.slug))
      .map((category) => {
        const inside = products.filter((p) => p.category === category.slug)
        return {
          key: category.slug,
          label: pick(category.name),
          count: inside.length,
          image: hasPhoto(category.image) ? category.image : photoOf(inside),
          active: false,
          onSelect: () => update({ category: category.slug, catalogue: '' }),
        }
      })
      .filter((circle) => circle.count > 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, categories, catalogues, filters.category, filters.catalogue, pick])

  // One circle is not a choice.
  if (circles.length < 2) return null

  const overflow = circles.length > CIRCLES
  const drawn = expanded || !overflow ? circles : circles.slice(0, CIRCLES)

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-3">
      {drawn.map((circle, index) => (
        <button
          key={circle.key}
          type="button"
          onClick={circle.onSelect}
          aria-pressed={circle.active}
          className="group flex w-20 flex-col items-center gap-1.5 text-center"
        >
          <span
            className={cn(
              'relative grid size-16 place-items-center overflow-hidden rounded-full border-2 bg-muted transition-colors',
              circle.active
                ? 'border-primary'
                : 'border-transparent group-hover:border-primary/40',
            )}
          >
            {circle.image ? (
              <Image
                src={circle.image}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <span
                className={cn(
                  'grid size-full place-items-center text-lg font-bold',
                  CIRCLE_TONES[index % CIRCLE_TONES.length],
                )}
              >
                {circle.label.slice(0, 1).toUpperCase()}
              </span>
            )}
          </span>
          <span
            className={cn(
              'line-clamp-1 text-xs font-medium',
              circle.active ? 'text-primary' : 'text-foreground',
            )}
          >
            {circle.label}
          </span>
        </button>
      ))}

      {overflow && (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="group flex w-20 flex-col items-center gap-1.5 text-center"
        >
          <span className="grid size-16 place-items-center rounded-full border-2 border-transparent bg-muted text-muted-foreground transition-colors group-hover:border-primary/40">
            <ArrowRight
              className={cn('size-5 transition-transform', expanded && 'rotate-180')}
              aria-hidden="true"
            />
          </span>
          <span className="text-xs font-medium text-foreground">
            {expanded ? copy.less : copy.more}
          </span>
        </button>
      )}
    </div>
  )
}

/** Tints for a circle with no photograph, cycled so neighbours differ. */
const CIRCLE_TONES = [
  'bg-primary/12 text-primary',
  'bg-accent-warm text-accent-warm-foreground',
  'bg-emerald-500/12 text-emerald-700',
  'bg-sky-500/12 text-sky-700',
] as const

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
        <ProductCard product={product} actions="button" />
      ) : (
        <ProductListCard product={product} />
      )}
      <p className="mt-1.5 truncate px-1 text-xs text-muted-foreground">
        {t.wholesale.market.soldByStore}
      </p>
    </div>
  )
}
