import type { Localized } from '@/lib/i18n'
import type { Product } from '@/lib/types'
import { discountPercent } from '@/lib/currency'

/**
 * The wholesale market's filters, as pure functions over the listings already
 * in the browser.
 *
 * Pure and free of React so the sidebar, the chip row and the grid all ask the
 * same question the same way — and so the counting rule below lives once.
 */

/** Stock in a category that has no catalogue set — the tree's "Others" row. */
export const UNSORTED = '__unsorted__'

export type MarketFilters = {
  search: string
  category: string
  catalogue: string
  sizes: string[]
  /** Lower-cased English colour names — what a listing stores and a seller types. */
  colours: string[]
  /** Null is "any price"; the slider's full width. */
  price: [number, number] | null
  /** Admin-defined choice fields: definition id → the values ticked. */
  attributes: Record<string, string[]>
  offersOnly: boolean
  inStockOnly: boolean
}

export const EMPTY_FILTERS: MarketFilters = {
  search: '',
  category: '',
  catalogue: '',
  sizes: [],
  colours: [],
  price: null,
  attributes: {},
  offersOnly: false,
  inStockOnly: false,
}

/**
 * Which filter to leave out. A facet's own counts are taken over the listings
 * that pass *every other* filter — so ticking "M" does not zero out "L" beside
 * it, and each number reads as "what you get if you tick this too".
 */
export type FacetKey =
  | 'size'
  | 'colour'
  | 'price'
  | 'offers'
  | 'stock'
  | `attribute:${string}`

/** Each listing's answers to the admin-defined fields: product id → field id → value. */
export type AttributeAnswers = Record<string, Record<string, string>>

export const colourKey = (name: Localized) => name.en.trim().toLowerCase()

export function matchesFilters(
  product: Product,
  filters: MarketFilters,
  context: {
    pick: (text: Localized) => string
    answers: AttributeAnswers
  },
  skip?: FacetKey,
): boolean {
  if (filters.category && product.category !== filters.category) return false

  if (filters.catalogue) {
    const inCatalogue =
      filters.catalogue === UNSORTED
        ? !product.catalogue
        : product.catalogue === filters.catalogue
    if (!inCatalogue) return false
  }

  // Product names only. The shop behind a listing is never shown to a buyer,
  // so searching by it would leak the very thing that is hidden.
  const term = filters.search.trim().toLowerCase()
  if (term && !context.pick(product.name).toLowerCase().includes(term)) {
    return false
  }

  if (skip !== 'size' && filters.sizes.length > 0) {
    if (!product.sizes?.some((size) => filters.sizes.includes(size))) return false
  }

  if (skip !== 'colour' && filters.colours.length > 0) {
    const has = product.colors?.some((colour) =>
      filters.colours.includes(colourKey(colour.name)),
    )
    if (!has) return false
  }

  if (skip !== 'price' && filters.price) {
    const [low, high] = filters.price
    if (product.price < low || product.price > high) return false
  }

  if (
    skip !== 'offers' &&
    filters.offersOnly &&
    discountPercent(product.price, product.oldPrice) === 0
  ) {
    return false
  }

  if (skip !== 'stock' && filters.inStockOnly && product.stock <= 0) {
    return false
  }

  for (const [definitionId, wanted] of Object.entries(filters.attributes)) {
    if (wanted.length === 0 || skip === `attribute:${definitionId}`) continue
    const answer = context.answers[product.id]?.[definitionId]
    if (!answer || !wanted.includes(answer)) return false
  }

  return true
}

/** How many listings carry each value, where a listing may carry several. */
export function countValues(
  products: Product[],
  valuesOf: (product: Product) => string[] | undefined,
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const product of products) {
    // A listing that repeats a value still counts once towards it.
    for (const value of new Set(valuesOf(product) ?? [])) {
      counts.set(value, (counts.get(value) ?? 0) + 1)
    }
  }
  return counts
}

/** How many filters are narrowing the grid — the badge on the mobile button. */
export function activeFilterCount(filters: MarketFilters): number {
  return (
    Number(Boolean(filters.search.trim())) +
    Number(Boolean(filters.category)) +
    Number(Boolean(filters.catalogue)) +
    filters.sizes.length +
    filters.colours.length +
    Number(Boolean(filters.price)) +
    Object.values(filters.attributes).reduce((sum, list) => sum + list.length, 0) +
    Number(filters.offersOnly) +
    Number(filters.inStockOnly)
  )
}
