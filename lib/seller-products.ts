import 'server-only'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'

/**
 * Ids for marketplace listings.
 *
 * A seller's product is an ordinary `products` row carrying a `sellerId`. That
 * is deliberate: cart, stock decrements, checkout, order history and the admin
 * product screens all keep working with no special cases, and the only thing
 * `sellerId` changes is which listings a product appears in.
 */

/** `Karim's Cotton Shirt` → `karims-cotton-shirt`, trimmed to fit the id column. */
function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return slug || 'item'
}

/**
 * Ids are human-readable but must not collide with a house product an admin
 * typed by hand, so every marketplace id is namespaced with `w-`.
 */
export async function uniqueProductId(base: string): Promise<string> {
  const candidate = `w-${slugify(base)}`

  const taken = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, candidate))

  if (!taken.length) return candidate

  // Fall back to a numbered suffix rather than refusing to save the product.
  for (let n = 2; n < 50; n += 1) {
    const next = `${candidate}-${n}`
    const clash = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, next))
    if (!clash.length) return next
  }

  throw new Error(`Could not find a free product id for "${base}"`)
}
