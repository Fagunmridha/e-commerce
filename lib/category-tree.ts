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
 *
 * **The line itself has to be in `all`**, or it has no destinations at all.
 * Callers pass the *active, trade-open* list, so a line an admin switched off —
 * or moved to shop-only — drops out of it; without this check its children,
 * still active themselves, were found by `parentSlug` anyway and a shop
 * approved for a disabled line kept listing under it. Checking here rather than
 * in each caller is what closes it for the form, the server action and the
 * sidebar in one place.
 */
export function categoriesInLine(
  all: Category[],
  line: CategorySlug,
): Category[] {
  if (!all.some((category) => category.slug === line)) return []

  const children = all.filter((category) => category.parentSlug === line)
  return children.length > 0
    ? children
    : all.filter((category) => category.slug === line)
}

/**
 * The same question for a shop approved for several lines at once — cloth and
 * cosmetics out of one warehouse.
 *
 * Order follows `lines`, then the order of `all` within each, so the seller's
 * dropdown reads line by line rather than alphabetically across all of them.
 * De-duplicated on slug: two lines cannot share a child today (a category has
 * one parent), but a childless line listed twice would otherwise appear twice.
 */
export function categoriesInLines(
  all: Category[],
  lines: CategorySlug[],
): Category[] {
  const seen = new Set<CategorySlug>()
  const found: Category[] = []

  for (const line of lines) {
    for (const category of categoriesInLine(all, line)) {
      if (seen.has(category.slug)) continue
      seen.add(category.slug)
      found.push(category)
    }
  }

  return found
}

/**
 * Is `slug` inside any of `lines`? The single definition of the boundary a
 * seller's listings may not cross — what the form offers and what the server
 * action checks, so neither can drift from the other.
 */
export function isInAnyLine(
  all: Category[],
  lines: CategorySlug[],
  slug: CategorySlug,
): boolean {
  return categoriesInLines(all, lines).some(
    (category) => category.slug === slug,
  )
}

/** The rows a product may actually be filed under — never a grouping row. */
export function leafCategories(all: Category[]): Category[] {
  const parents = new Set(
    all.map((category) => category.parentSlug).filter(Boolean),
  )
  return all.filter((category) => !parents.has(category.slug))
}
