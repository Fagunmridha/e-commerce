'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { catalogues } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/auth'
import { catalogueSchema, type CatalogueInput } from '@/lib/validation/admin'
import { parseOrThrow } from '@/lib/validation/shared'

export type { CatalogueInput }

/**
 * Admin management of the catalogue tree's second level.
 *
 * These throw rather than returning a result object, matching the rest of
 * `app/actions/admin.ts` — the caller is the store owner in their own console,
 * where an error boundary is the right place for "that did not work".
 */

function refresh() {
  // Catalogues are read through `unstable_cache` on the `catalogue` tag, the
  // same as products and categories, so every storefront grid picks the change
  // up on its next render rather than up to 60s later.
  updateTag('catalogue')
  revalidatePath('/admin/catalogues')
  revalidatePath('/admin/products')
}

export async function upsertCatalogue(input: CatalogueInput): Promise<void> {
  await requireAdmin()
  const data = parseOrThrow(catalogueSchema, input)

  const values = {
    slug: data.slug,
    categorySlug: data.categorySlug,
    name: data.name,
    position: data.position,
  }

  await db
    .insert(catalogues)
    .values(values)
    .onConflictDoUpdate({ target: catalogues.slug, set: values })

  refresh()
}

/**
 * Deletes a catalogue. Products filed under it are *not* deleted — the foreign
 * key is `ON DELETE SET NULL`, so they fall back to appearing under "All" in
 * their category. Removing a way of grouping stock must never remove the stock.
 */
export async function deleteCatalogue(slug: string): Promise<void> {
  await requireAdmin()
  await db.delete(catalogues).where(eq(catalogues.slug, slug))
  refresh()
}
