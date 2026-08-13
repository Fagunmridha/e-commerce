'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Search,
  X,
  SlidersHorizontal,
  Grid3X3,
  List,
  RotateCcw,
  Check,
  ChevronDown,
  FilterIcon,
} from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { ProductListCard } from '@/components/product-list-card'
import { Reveal } from '@/components/reveal'
import { useLanguage } from '@/components/language-provider'
import { useCatalogue } from '@/components/catalogue-provider'
import { cn } from '@/lib/utils'
import type { CategorySlug } from '@/lib/types'

type Filter = CategorySlug | 'all'
type SortKey = 'featured' | 'newest' | 'rating' | 'price-asc' | 'price-desc'
type ViewMode = 'grid' | 'list'

const ITEMS_PER_PAGE = 12

export function ShopBrowser({ initialFilter = 'all' }: { initialFilter?: Filter }) {
  const { t, pick, price: formatPrice } = useLanguage()
  const { products: allProducts, categories } = useCatalogue()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Extract query params
  const categoryParam = (searchParams.get('category') as Filter) || initialFilter
  const sortParam = (searchParams.get('sort') as SortKey) || 'featured'
  const queryParam = searchParams.get('q') || ''
  const minPriceParam = searchParams.get('minPrice') || ''
  const maxPriceParam = searchParams.get('maxPrice') || ''
  const inStockParam = searchParams.get('inStock') === 'true'
  const viewParam = (searchParams.get('view') as ViewMode) || 'grid'

  // Local state initialized from URL params
  const [filter, setFilter] = useState<Filter>(categoryParam)
  const [sort, setSort] = useState<SortKey>(sortParam)
  const [searchQuery, setSearchQuery] = useState(queryParam)
  const [minPrice, setMinPrice] = useState(minPriceParam)
  const [maxPrice, setMaxPrice] = useState(maxPriceParam)
  const [inStockOnly, setInStockOnly] = useState(inStockParam)
  const [viewMode, setViewMode] = useState<ViewMode>(viewParam)
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [desktopFilterOpen, setDesktopFilterOpen] = useState(true)

  // Sync state when URL params change externally
  useEffect(() => {
    setFilter(categoryParam)
    setSort(sortParam)
    setSearchQuery(queryParam)
    setMinPrice(minPriceParam)
    setMaxPrice(maxPriceParam)
    setInStockOnly(inStockParam)
    setViewMode(viewParam)
  }, [
    categoryParam,
    sortParam,
    queryParam,
    minPriceParam,
    maxPriceParam,
    inStockParam,
    viewParam,
  ])

  // Helper to update URL params
  const updateQueryParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '' || value === 'all' || value === 'false') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })
      const queryString = params.toString()
      const newPath = queryString ? `${pathname}?${queryString}` : pathname
      router.push(newPath, { scroll: false })
    },
    [searchParams, pathname, router],
  )

  // Handlers
  const handleCategoryChange = (cat: Filter) => {
    setFilter(cat)
    setVisibleCount(ITEMS_PER_PAGE)
    updateQueryParams({ category: cat === 'all' ? null : cat })
  }

  const handleSortChange = (newSort: SortKey) => {
    setSort(newSort)
    updateQueryParams({ sort: newSort === 'featured' ? null : newSort })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setVisibleCount(ITEMS_PER_PAGE)
    updateQueryParams({ q: searchQuery.trim() || null })
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    updateQueryParams({ q: null })
  }

  const handleApplyPriceFilter = () => {
    setVisibleCount(ITEMS_PER_PAGE)
    updateQueryParams({
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
    })
  }

  const handleToggleInStock = (checked: boolean) => {
    setInStockOnly(checked)
    setVisibleCount(ITEMS_PER_PAGE)
    updateQueryParams({ inStock: checked ? 'true' : null })
  }

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    updateQueryParams({ view: mode === 'grid' ? null : mode })
  }

  const handleClearAllFilters = () => {
    setFilter('all')
    setSort('featured')
    setSearchQuery('')
    setMinPrice('')
    setMaxPrice('')
    setInStockOnly(false)
    setVisibleCount(ITEMS_PER_PAGE)
    router.push(pathname, { scroll: false })
  }

  // Filter and sort products logic
  const filteredProducts = useMemo(() => {
    let list = [...allProducts]

    // Category Filter
    if (filter !== 'all') {
      list = list.filter((p) => p.category === filter)
    }

    // Search Query Filter
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (p) =>
          p.name.en.toLowerCase().includes(q) ||
          p.name.bn.toLowerCase().includes(q),
      )
    }

    // Min Price Filter
    if (minPrice !== '') {
      const min = Number(minPrice)
      if (!isNaN(min)) {
        list = list.filter((p) => p.price >= min)
      }
    }

    // Max Price Filter
    if (maxPrice !== '') {
      const max = Number(maxPrice)
      if (!isNaN(max)) {
        list = list.filter((p) => p.price <= max)
      }
    }

    // In-Stock Filter
    if (inStockOnly) {
      list = list.filter((p) => p.stock > 0)
    }

    // Sorting
    if (sort === 'price-asc') {
      list.sort((a, b) => a.price - b.price)
    } else if (sort === 'price-desc') {
      list.sort((a, b) => b.price - a.price)
    } else if (sort === 'rating') {
      list.sort((a, b) => b.rating - a.rating)
    } else if (sort === 'newest') {
      list.sort((a, b) => (b.badge === 'new' ? 1 : 0) - (a.badge === 'new' ? 1 : 0))
    }

    return list
  }, [allProducts, filter, searchQuery, minPrice, maxPrice, inStockOnly, sort])

  // Displayed slice for pagination
  const displayedProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount],
  )

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filter !== 'all') count++
    if (searchQuery.trim()) count++
    if (minPrice !== '') count++
    if (maxPrice !== '') count++
    if (inStockOnly) count++
    return count
  }, [filter, searchQuery, minPrice, maxPrice, inStockOnly])

  const categoryOptions = [
    { value: 'all' as Filter, label: t.shop.all },
    ...categories.map((c) => ({
      value: c.slug as Filter,
      label: pick(c.name),
    })),
  ]

  const sortOptions: { value: SortKey; label: string }[] = [
    { value: 'featured', label: t.shop.sortFeatured },
    { value: 'newest', label: t.shop.sortNewest },
    { value: 'rating', label: t.shop.sortRating },
    { value: 'price-asc', label: t.shop.sortPriceAsc },
    { value: 'price-desc', label: t.shop.sortPriceDesc },
  ]

  return (
    <div className="py-8">
      {/* Top Search & Filter Bar */}
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-4">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.shop.searchPlaceholder}
              className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-9 text-sm outline-none transition-colors focus:border-foreground focus:ring-2 focus:ring-ring/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </form>

          {/* Controls: Filter Toggle, View Switcher & Sort */}
          <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
            {/* Desktop Filter Toggle */}
            <button
              type="button"
              onClick={() => setDesktopFilterOpen(!desktopFilterOpen)}
              className={cn(
                'hidden md:flex h-10 items-center gap-2 rounded-xl border px-4 text-xs font-semibold transition-colors',
                desktopFilterOpen || activeFiltersCount > 0
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-background text-foreground hover:bg-secondary',
              )}
            >
              <SlidersHorizontal className="size-4" />
              <span>{t.shop.filterTitle}</span>
              {activeFiltersCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Mobile Filter Drawer Button */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="flex md:hidden h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-xs font-semibold text-foreground"
            >
              <FilterIcon className="size-4" />
              <span>{t.shop.filterTitle}</span>
              {activeFiltersCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="shop-sort" className="shrink-0 text-xs text-muted-foreground font-medium hidden sm:inline">
                {t.shop.sortBy}:
              </label>
              <select
                id="shop-sort"
                value={sort}
                onChange={(e) => handleSortChange(e.target.value as SortKey)}
                className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-medium outline-none focus:ring-2 focus:ring-ring/20"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Switcher (Grid / List) */}
            <div className="flex items-center rounded-xl border border-border bg-background p-1">
              <button
                type="button"
                onClick={() => handleViewModeChange('grid')}
                aria-label={t.shop.viewGrid}
                className={cn(
                  'flex size-8 items-center justify-center rounded-lg transition-colors',
                  viewMode === 'grid'
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Grid3X3 className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('list')}
                aria-label={t.shop.viewList}
                className={cn(
                  'flex size-8 items-center justify-center rounded-lg transition-colors',
                  viewMode === 'list'
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <List className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/40 p-3">
            <span className="text-xs font-bold text-muted-foreground">
              {t.shop.activeFilters}:
            </span>

            {filter !== 'all' && (
              <button
                type="button"
                onClick={() => handleCategoryChange('all')}
                className="flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-1 text-xs font-medium border border-border shadow-xs hover:border-foreground/40"
              >
                <span>Category: {categoryOptions.find((c) => c.value === filter)?.label}</span>
                <X className="size-3 text-muted-foreground hover:text-foreground" />
              </button>
            )}

            {searchQuery.trim() && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-1 text-xs font-medium border border-border shadow-xs hover:border-foreground/40"
              >
                <span>Search: &quot;{searchQuery}&quot;</span>
                <X className="size-3 text-muted-foreground hover:text-foreground" />
              </button>
            )}

            {(minPrice !== '' || maxPrice !== '') && (
              <button
                type="button"
                onClick={() => {
                  setMinPrice('')
                  setMaxPrice('')
                  updateQueryParams({ minPrice: null, maxPrice: null })
                }}
                className="flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-1 text-xs font-medium border border-border shadow-xs hover:border-foreground/40"
              >
                <span>
                  Price: {minPrice ? formatPrice(Number(minPrice)) : '৳0'} -{' '}
                  {maxPrice ? formatPrice(Number(maxPrice)) : '∞'}
                </span>
                <X className="size-3 text-muted-foreground hover:text-foreground" />
              </button>
            )}

            {inStockOnly && (
              <button
                type="button"
                onClick={() => handleToggleInStock(false)}
                className="flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-1 text-xs font-medium border border-border shadow-xs hover:border-foreground/40"
              >
                <span>{t.shop.inStockOnly}</span>
                <X className="size-3 text-muted-foreground hover:text-foreground" />
              </button>
            )}

            <button
              type="button"
              onClick={handleClearAllFilters}
              className="ml-auto text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <RotateCcw className="size-3" />
              <span>{t.shop.clearAll}</span>
            </button>
          </div>
        )}

        {/* Main Content Layout (Sidebar + Product Grid) */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Desktop Filter Sidebar */}
          {desktopFilterOpen && (
            <aside className="hidden md:block w-64 shrink-0 space-y-6">
              {/* Category Filter */}
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t.sections.topCategories}
                </h3>
                <div className="space-y-1">
                  {categoryOptions.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => handleCategoryChange(cat.value)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                        filter === cat.value
                          ? 'bg-foreground text-background'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                      )}
                    >
                      <span>{cat.label}</span>
                      {filter === cat.value && <Check className="size-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t.shop.priceRange}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder={t.shop.minPrice}
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring/20"
                    />
                    <span className="text-muted-foreground text-xs">-</span>
                    <input
                      type="number"
                      placeholder={t.shop.maxPrice}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyPriceFilter}
                    className="w-full rounded-lg bg-secondary py-2 text-xs font-bold text-foreground transition-colors hover:bg-foreground hover:text-background"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>

              {/* In-Stock Filter */}
              <div className="rounded-xl border border-border bg-card p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-semibold text-foreground">
                    {t.shop.inStockOnly}
                  </span>
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => handleToggleInStock(e.target.checked)}
                    className="size-4 rounded border-border text-primary focus:ring-ring"
                  />
                </label>
              </div>
            </aside>
          )}

          {/* Product Listing Area */}
          <main className="flex-1">
            {/* Products Counter Bar */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                {t.shop.showingProducts
                  .replace('{shown}', String(displayedProducts.length))
                  .replace('{total}', String(filteredProducts.length))}
              </p>
            </div>

            {/* Empty State */}
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
                <SlidersHorizontal className="size-10 text-muted-foreground/60 mb-3" />
                <h3 className="text-base font-bold text-foreground mb-1">
                  {t.sections.noProductsForFilter}
                </h3>
                <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                  Try adjusting your search query, price limits, or selected categories.
                </p>
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
                >
                  <RotateCcw className="size-3.5" />
                  <span>{t.shop.clearAll}</span>
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              /* Grid Layout */
              <div
                className={cn(
                  'grid gap-4 sm:gap-6 grid-cols-2',
                  desktopFilterOpen
                    ? 'md:grid-cols-2 lg:grid-cols-3'
                    : 'md:grid-cols-3 lg:grid-cols-4',
                )}
              >
                {displayedProducts.map((product, index) => (
                  <Reveal key={product.id} delay={(index % 4) * 60}>
                    <ProductCard product={product} />
                  </Reveal>
                ))}
              </div>
            ) : (
              /* List Layout */
              <div className="space-y-4">
                {displayedProducts.map((product, index) => (
                  <Reveal key={product.id} delay={(index % 4) * 60}>
                    <ProductListCard product={product} />
                  </Reveal>
                ))}
              </div>
            )}

            {/* Load More Button */}
            {visibleCount < filteredProducts.length && (
              <div className="mt-12 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                  className="flex items-center gap-2 rounded-full border border-foreground bg-background px-8 py-3 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-foreground hover:text-background shadow-xs"
                >
                  <span>{t.shop.loadMore}</span>
                  <ChevronDown className="size-4" />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Slide-over Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileFilterOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative ml-auto flex h-full w-full max-w-xs flex-col bg-background p-6 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <SlidersHorizontal className="size-4" />
                <span>{t.shop.filterTitle}</span>
              </h2>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-6 flex-1">
              {/* Category Filter */}
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t.sections.topCategories}
                </h3>
                <div className="space-y-1">
                  {categoryOptions.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => handleCategoryChange(cat.value)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                        filter === cat.value
                          ? 'bg-foreground text-background'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                      )}
                    >
                      <span>{cat.label}</span>
                      {filter === cat.value && <Check className="size-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t.shop.priceRange}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder={t.shop.minPrice}
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring/20"
                    />
                    <span className="text-muted-foreground text-xs">-</span>
                    <input
                      type="number"
                      placeholder={t.shop.maxPrice}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring/20"
                    />
                  </div>
                </div>
              </div>

              {/* In-Stock Filter */}
              <div className="rounded-xl border border-border bg-card p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-semibold text-foreground">
                    {t.shop.inStockOnly}
                  </span>
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => handleToggleInStock(e.target.checked)}
                    className="size-4 rounded border-border text-primary focus:ring-ring"
                  />
                </label>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-border mt-auto flex gap-3">
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="flex-1 rounded-xl border border-border py-2.5 text-xs font-bold text-foreground hover:bg-secondary"
              >
                {t.shop.clearAll}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleApplyPriceFilter()
                  setMobileFilterOpen(false)
                }}
                className="flex-1 rounded-xl bg-foreground py-2.5 text-xs font-bold text-background"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
