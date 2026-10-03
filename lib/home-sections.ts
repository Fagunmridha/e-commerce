import type { Product } from '@/lib/types'

/**
 * The homepage's product rows. Each one's "View All" opens /shop?section=<key>,
 * and the shop narrows to the same list — so the rules live here, shared by
 * both, rather than being restated in each.
 */
export const HOME_SECTIONS = ['top', 'trending', 'new', 'combo'] as const
export type HomeSection = (typeof HOME_SECTIONS)[number]

export function isHomeSection(value: string | null): value is HomeSection {
  return (HOME_SECTIONS as readonly string[]).includes(value ?? '')
}

/**
 * Every product in a section, in the section's own order, uncapped. Each list
 * holds only stock that belongs to it — a section with nothing in it comes back
 * empty and its homepage row hides, rather than being backfilled with the rest
 * of the catalogue.
 */
export function sectionProducts(
  section: HomeSection,
  products: Product[],
): Product[] {
  switch (section) {
    // Hand-picked by the admin; best-rated first among the picks.
    case 'top':
      return products
        .filter((product) => product.isTop)
        .sort((a, b) => b.rating - a.rating)
    // Hand-picked by the admin; most-reviewed first among the picks.
    case 'trending':
      return products
        .filter((product) => product.isTrending)
        .sort((a, b) => b.reviews - a.reviews)
    // The catalogue has no createdAt, so `new` badges stand in for recency.
    case 'new':
      return products.filter((product) => product.badge === 'new')
    // Hand-curated by the admin.
    case 'combo':
      return products.filter((product) => product.isCombo)
  }
}
