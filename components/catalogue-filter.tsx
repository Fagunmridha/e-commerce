'use client'

import { useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLanguage } from '@/components/language-provider'
import type { Catalogue, Category, Product } from '@/lib/types'

/**
 * The category → catalogue pair of dropdowns, shared by every grid that has
 * one: the category pages, /shop, and both wholesale views.
 *
 * One component rather than a copy per grid because the awkward part is not
 * the markup, it is the two rules the pair has to keep:
 *
 *  1. Only offer branches that have stock behind them, so a shopper cannot
 *     pick a filter that empties the grid.
 *  2. Changing the category clears the catalogue. "Men's + Saree" is not a
 *     narrower search, it is an empty one, and leaving a stale catalogue
 *     selected is the easiest way to show someone a blank page.
 *
 * Omit `onCategoryChange` on a page whose category is fixed (`/men`) — the
 * category dropdown disappears and only the catalogue one is rendered.
 */
export function CatalogueFilter({
  categories,
  catalogues,
  category,
  catalogue,
  onCategoryChange,
  onCatalogueChange,
  available,
  className,
}: {
  categories: Category[]
  catalogues: Catalogue[]
  /** Empty string means "all". */
  category: string
  catalogue: string
  /** Omit to fix the category and render the catalogue dropdown alone. */
  onCategoryChange?: (slug: string) => void
  onCatalogueChange: (slug: string) => void
  /**
   * The products this filter is filtering. Used only to hide options that
   * would produce an empty grid — pass the *unfiltered* list, or the options
   * vanish as soon as one is picked.
   */
  available: Product[]
  className?: string
}) {
  const { t, pick } = useLanguage()
  const copy = t.catalogue

  const usableCategories = useMemo(
    () =>
      categories.filter((item) =>
        available.some((product) => product.category === item.slug),
      ),
    [categories, available],
  )

  const usableCatalogues = useMemo(() => {
    // With no category picked the dropdown spans the whole store, which is what
    // /shop and the wholesale market want. A category page passes one and gets
    // just its own branch.
    const inScope = category
      ? catalogues.filter((item) => item.categorySlug === category)
      : catalogues

    return inScope.filter((item) =>
      available.some((product) => product.catalogue === item.slug),
    )
  }, [catalogues, category, available])

  // A category with no catalogues under it (accessories, say) should not show
  // an empty dropdown — but the category selector still has work to do.
  const showCatalogues = usableCatalogues.length > 0

  if (!onCategoryChange && !showCatalogues) return null

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className ?? ''}`}>
      {onCategoryChange && (
        <Select
          value={category || 'all'}
          onValueChange={(value) => {
            const next = value === 'all' ? '' : value
            onCategoryChange(next)
            // Rule 2 — the old catalogue almost certainly belongs to the
            // category being left behind.
            onCatalogueChange('')
          }}
        >
          <SelectTrigger size="sm" className="min-w-40" aria-label={copy.category}>
            <SelectValue placeholder={copy.allCategories} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{copy.allCategories}</SelectItem>
            {usableCategories.map((item) => (
              <SelectItem key={item.slug} value={item.slug}>
                {pick(item.name)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showCatalogues && (
        <Select
          value={catalogue || 'all'}
          onValueChange={(value) =>
            onCatalogueChange(value === 'all' ? '' : value)
          }
        >
          <SelectTrigger size="sm" className="min-w-40" aria-label={copy.catalogue}>
            <SelectValue placeholder={copy.allCatalogues} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{copy.allCatalogues}</SelectItem>
            {usableCatalogues.map((item) => (
              <SelectItem key={item.slug} value={item.slug}>
                {pick(item.name)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
