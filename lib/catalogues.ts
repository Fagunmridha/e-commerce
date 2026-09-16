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
      status: catalogues.status,
      productCount: sql<string>`count(${products.id})`,
    })
    .from(catalogues)
    .leftJoin(products, eq(products.catalogueSlug, catalogues.slug))
    .groupBy(catalogues.slug)
    .orderBy(asc(catalogues.categorySlug), asc(catalogues.position), asc(catalogues.slug))

  return rows.map((row) => ({ ...row, productCount: Number(row.productCount) }))
}

export type CatalogueCheck =
  | { ok: true; slug: CatalogueSlug | null }
  | { ok: false; error: string }

/**
 * Checks a submitted catalogue against the category it was submitted with.
 *
 * Refuses rather than repairs. This used to drop a mismatch to null and save
 * the product under "All", on the theory that a form had simply failed to clear
 * a stale field. But a server action is a public endpoint, and "category =
 * Women's Wear, catalogue = Jeans" from a hand-made request is not a stale
 * field — it is a request to file something where it does not belong, and
 * quietly accepting half of it hid that. Every refusal here is one the forms
 * can never produce, so no honest user ever sees these messages.
 *
 * Three questions, in order: does the catalogue exist, is it under this
 * category, and is it still open for new listings. The last is what makes an
 * admin's "Inactive" mean something on the server and not only in a dropdown.
 *
 * `allowInactive` is for an *edit* that keeps the catalogue it already had:
 * switching a catalogue off must stop new filings, not make every product
 * already filed there unsaveable until it is moved.
 *
 * The pairing is also a composite foreign key on `products` (see schema.ts), so
 * a write that got past this would still be refused by the database; this is
 * what turns that refusal into a sentence.
 */
export async function checkCatalogue(
  categorySlug: CategorySlug,
  catalogueSlug: CatalogueSlug | null | undefined,
  { allowInactive = false }: { allowInactive?: boolean } = {},
): Promise<CatalogueCheck> {
  if (!catalogueSlug) return { ok: true, slug: null }

  const [row] = await db
    .select({
      categorySlug: catalogues.categorySlug,
      status: catalogues.status,
    })
    .from(catalogues)
    .where(eq(catalogues.slug, catalogueSlug))

  if (!row) return { ok: false, error: 'That catalogue does not exist.' }
  if (row.categorySlug !== categorySlug) {
    return {
      ok: false,
      error: 'That catalogue does not belong to the chosen category.',
    }
  }
  if (row.status !== 'active' && !allowInactive) {
    return {
      ok: false,
      error: 'That catalogue is closed to new listings.',
    }
  }
  return { ok: true, slug: catalogueSlug }
}
