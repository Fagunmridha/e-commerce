'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { count, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { catalogues, products } from '@/lib/db/schema'
import { isUniqueViolation } from '@/lib/db/errors'
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

  // Moving a catalogue to another category would leave every product in it
  // filed under a category its catalogue no longer belongs to — Saree under
  // Men's Wear. The composite foreign key refuses that outright; this says why
  // before the database has to.
  const [current] = await db
    .select({ categorySlug: catalogues.categorySlug })
    .from(catalogues)
    .where(eq(catalogues.slug, data.slug))
  if (current && current.categorySlug !== data.categorySlug) {
    const held = await productsIn(data.slug)
    if (held > 0) {
      throw new Error(
        `This catalogue contains ${held} product(s), so it cannot move to another category. Move the products first, or create a new catalogue there.`,
      )
    }
  }

  const values = {
    slug: data.slug,
    categorySlug: data.categorySlug,
    name: data.name,
    position: data.position,
    status: data.status,
  }

  try {
    await db
      .insert(catalogues)
      .values(values)
      // `createdAt` stays out of the update — an edit is not a new row.
      .onConflictDoUpdate({
        target: catalogues.slug,
        set: { ...values, updatedAt: new Date() },
      })
  } catch (error) {
    if (isUniqueViolation(error, 'catalogues_category_name_idx')) {
      throw new Error(
        'A catalogue with that English name already exists in this category',
      )
    }
    throw error
  }

  refresh()
}

/** How many products are filed under a catalogue — the thing a delete or move would strand. */
async function productsIn(slug: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(products)
    .where(eq(products.catalogueSlug, slug))
  return row?.n ?? 0
}

/**
 * Deletes a catalogue — only an empty one.
 *
 * This used to be allowed with products inside, and quietly unfiled them to
 * "All". That is recoverable only if someone remembers which hundred products
 * were Jeans; nobody does. So a catalogue that holds anything is refused, with
 * the two honest ways forward named: move the products, or switch the
 * catalogue to Inactive, which hides it from every picker and loses nothing.
 *
 * The count is a courtesy, not the guard. There is no transaction over Neon's
 * HTTP driver, so a product filed between this read and the delete would slip
 * past it; the composite foreign key on `products` is RESTRICT and refuses the
 * delete itself, and the catch below turns that into the same sentence.
 */
export async function deleteCatalogue(slug: string): Promise<void> {
  await requireAdmin()

  const held = await productsIn(slug)
  if (held > 0) {
    throw new Error(
      `This catalogue contains ${held} product(s). Move or reassign the products before deleting — or set it to Inactive to hide it without losing anything.`,
    )
  }

  try {
    await db.delete(catalogues).where(eq(catalogues.slug, slug))
  } catch (error) {
    if (/foreign key|violates/i.test(error instanceof Error ? error.message : '')) {
      throw new Error(
        'A product was filed under this catalogue just now — reload and try again.',
      )
    }
    throw error
  }
  refresh()
}
