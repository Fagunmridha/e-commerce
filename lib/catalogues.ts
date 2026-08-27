import 'server-only'
import { asc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { catalogues, products } from '@/lib/db/schema'
import type { Catalogue, CatalogueSlug, CategorySlug } from '@/lib/types'

/**
 * Every catalogue with the number of products filed under it. The admin list
 * only — uncached, because someone managing catalogues should never be shown
 * a stale count of what they are about to delete.
 */
export async function getAdminCatalogues(): Promise<
  (Catalogue & { productCount: number })[]
> {
  const rows = await db
    .select({
      slug: catalogues.slug,
      categorySlug: catalogues.categorySlug,
      name: catalogues.name,
      position: catalogues.position,
      productCount: sql<string>`count(${products.id})`,
    })
    .from(catalogues)
    .leftJoin(products, eq(products.catalogueSlug, catalogues.slug))
    .groupBy(catalogues.slug)
    .orderBy(asc(catalogues.categorySlug), asc(catalogues.position), asc(catalogues.slug))

  return rows.map((row) => ({ ...row, productCount: Number(row.productCount) }))
}

/**
 * Resolves a submitted catalogue against the category it was submitted with,
 * returning the slug only when the two actually belong together.
 *
 * The pairing cannot be a foreign key — the database has no way to express
 * "this column's row must agree with that column" — so it is checked here, on
 * the one path every product write goes through. A mismatch is silently
 * dropped to null rather than thrown: it means a form's category was changed
 * without its catalogue being cleared, and filing the product under "All" is
 * the right recovery. A wrong branch would be worse than none.
 */
export async function resolveCatalogue(
  categorySlug: CategorySlug,
  catalogueSlug: CatalogueSlug | null | undefined,
): Promise<CatalogueSlug | null> {
  if (!catalogueSlug) return null

  const [row] = await db
    .select({ categorySlug: catalogues.categorySlug })
    .from(catalogues)
    .where(eq(catalogues.slug, catalogueSlug))

  return row?.categorySlug === categorySlug ? catalogueSlug : null
}
