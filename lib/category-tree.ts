import type { Category, CategorySlug } from '@/lib/types'

/**
 * The shape of the catalogue tree, as two pure functions.
 *
 * Deliberately free of any database import: the seller's product form and the
 * server action that saves it both need to answer "may this shop file a product
 * here", and they must never be able to disagree. One module, imported by both.
 */

/**
 * Where a shop approved for `line` may file a product.
 *
 * A childless line is its own only destination — a shop trading in Electronics
 * with no sub-categories set up lists straight under Electronics. That falls
 * out of the same rule rather than needing a branch of its own, which is why
 * the fallback is here and not in every caller.
 */
export function categoriesInLine(
  all: Category[],
  line: CategorySlug,
): Category[] {
  const children = all.filter((category) => category.parentSlug === line)
  return children.length > 0
    ? children
    : all.filter((category) => category.slug === line)
}

/**
 * Is `slug` inside `line`? The single definition of the boundary a seller's
 * listings may not cross.
 */
export function isInLine(
  all: Category[],
  line: CategorySlug,
  slug: CategorySlug,
): boolean {
  return categoriesInLine(all, line).some((category) => category.slug === slug)
}

/** The rows a product may actually be filed under — never a grouping row. */
export function leafCategories(all: Category[]): Category[] {
  const parents = new Set(
    all.map((category) => category.parentSlug).filter(Boolean),
  )
  return all.filter((category) => !parents.has(category.slug))
}
