'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { count, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { categories, products } from '@/lib/db/schema'
import { isUniqueViolation } from '@/lib/db/errors'
import { requireAdmin } from '@/lib/auth'
import { categorySchema, type CategoryInput } from '@/lib/validation/admin'
import { parseOrThrow } from '@/lib/validation/shared'

export type { CategoryInput }

/**
 * Admin management of the catalogue tree's top two levels — the trade lines
 * and the categories under them.
 *
 * These throw rather than returning a result object, matching the catalogue
 * and product actions beside them: the caller is the store owner in their own
 * console, where an error boundary is the right place for "that did not work".
 */

function refresh() {
  // Categories are read through `unstable_cache` on the `catalogue` tag, so
  // every storefront grid picks the change up on its next render.
  updateTag('catalogue')
  revalidatePath('/admin/categories')
  revalidatePath('/admin/catalogues')
  revalidatePath('/admin/products')
  // The category list is in the header of every page, and `app/[category]` is
  // prerendered from it. `updateTag` busts the data cache but not those route
  // caches, so the whole tree under the root layout has to go with it.
  revalidatePath('/', 'layout')
}

export async function upsertCategory(input: CategoryInput): Promise<void> {
  await requireAdmin()
  const data = parseOrThrow(categorySchema, input)

  if (data.parentSlug) {
    const rows = await db
      .select({ slug: categories.slug, parentSlug: categories.parentSlug })
      .from(categories)

    // The tree is capped at two levels, so a parent may not have a parent of
    // its own — otherwise a line could sit under a line and the sidebar would
    // have four levels to draw once catalogues are counted.
    const parent = rows.find((row) => row.slug === data.parentSlug)
    if (!parent) throw new Error('That parent category does not exist')
    if (parent.parentSlug) {
      throw new Error('A category can only be one level deep')
    }

    // The same rule from the other side: a row that already has children
    // cannot become someone else's child. Without this, one edit quietly
    // builds the third level the check above exists to prevent.
    if (rows.some((row) => row.parentSlug === data.slug)) {
      throw new Error(
        'This category has sub-categories, so it cannot sit under another',
      )
    }
  }

  const values = {
    slug: data.slug,
    name: data.name,
    image: data.image,
    scope: data.scope,
    parentSlug: data.parentSlug,
    position: data.position,
    status: data.status,
  }

  try {
    await db
      .insert(categories)
      .values(values)
      // `createdAt` is absent from the update on purpose: an edit must not
      // restamp when the row first appeared.
      .onConflictDoUpdate({
        target: categories.slug,
        set: { ...values, updatedAt: new Date() },
      })
  } catch (error) {
    // `categories_parent_name_idx` — two rows under one line sharing an English
    // name. Postgres says "duplicate key value violates unique constraint",
    // which is true and useless; this says which field to change.
    if (isUniqueViolation(error, 'categories_parent_name_idx')) {
      throw new Error(
        data.parentSlug
          ? 'A category with that English name already exists under this trade line'
          : 'A trade line with that English name already exists',
      )
    }
    throw error
  }

  refresh()
}

/**
 * Deletes a category.
 *
 * Blocked while any product still points at it — that foreign key is
 * ON DELETE RESTRICT, deliberately: removing a way of grouping stock must
 * never remove the stock, and unlike a catalogue there is nothing for a
 * product to fall back to, because `products.category` is NOT NULL. Sub-
 * categories block it for the same reason, so a line cannot be pulled out
 * from under its children.
 *
 * The count below is a courtesy, not the guard. There is no transaction over
 * Neon's HTTP driver, so a product created between the read and the delete
 * would slip past it — the database is what actually enforces this, and this
 * only turns its message into one an admin can act on. The catch does the
 * same for the race.
 *
 * Its catalogues DO go: that foreign key cascades. And any wholesale shop
 * approved for it drops back to having no trade line.
 */
export async function deleteCategory(slug: string): Promise<void> {
  await requireAdmin()

  const [row] = await db
    .select({ n: count() })
    .from(products)
    .where(eq(products.category, slug))

  if ((row?.n ?? 0) > 0) {
    throw new Error(
      `This category contains ${row.n} product(s). Move or reassign the products before deleting — or set it to Inactive to hide it without losing anything.`,
    )
  }

  try {
    await db.delete(categories).where(eq(categories.slug, slug))
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (/foreign key|violates/i.test(message)) {
      throw new Error(
        'Something was filed under this category just now — reload and try again.',
      )
    }
    throw error
  }

  refresh()
}
