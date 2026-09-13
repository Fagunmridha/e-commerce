'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import { requireApprovedWholesaler } from '@/lib/wholesalers'
import { resolveCatalogue } from '@/lib/catalogues'
import { isInAnyLine } from '@/lib/category-tree'
import {
  attributeWrites,
  definitionsForCategory,
  getAllAttributeDefinitions,
} from '@/lib/attributes'
import { getWholesaleCategories } from '@/lib/products'
import { uniqueProductId } from '@/lib/seller-products'
import { parseOrThrow } from '@/lib/validation/shared'
import {
  sellerProductSchema,
  type SellerProductInput,
} from '@/lib/validation/wholesalers'

export type { SellerProductInput }

type Result = { ok: true } | { ok: false; error: string }

/**
 * An approved seller's own listings.
 *
 * Like the application action and unlike the admin ones, these return a result
 * object instead of throwing: the caller is a shopkeeper filling in a form, and
 * "something went wrong" in a toast is not a useful thing to hand them.
 *
 * Every write is scoped by `sellerId` as well as `id`. Server actions are public
 * endpoints, so "this id belongs to me" has to be part of the WHERE clause — not
 * something the dashboard is trusted to have checked.
 */

/**
 * Writes a product's answers to the admin-defined fields for its category.
 *
 * The definitions are re-resolved here from the category the product is
 * actually being filed under, never from anything the client sent — a seller
 * who posts an answer to an Electronics field on a Men's Wear listing has it
 * dropped by `attributeWrites`, which only keeps ids in this list.
 *
 * Shared by both branches of the upsert. A failure here is deliberately not
 * fatal to the save: the listing itself is already written, and telling a
 * seller their product did not save when it did is worse than a spec sheet that
 * needs one more press of Save.
 */
async function saveAttributes(
  productId: string,
  categorySlug: string,
  values: { definitionId: string; value: string }[],
): Promise<void> {
  const [definitions, categories] = await Promise.all([
    getAllAttributeDefinitions(),
    getWholesaleCategories(),
  ])
  const allowed = definitionsForCategory(definitions, categories, categorySlug)

  await db.batch(attributeWrites(productId, values, allowed))
}

function refresh() {
  // Busts the cached catalogue queries so the market reflects the edit at once.
  updateTag('catalogue')
  revalidatePath('/wholesale/dashboard')
  revalidatePath('/wholesale/market')
}

export async function upsertSellerProduct(
  input: SellerProductInput,
): Promise<Result> {
  let shop
  let lines
  try {
    ;({ shop, lines } = await requireApprovedWholesaler())
  } catch {
    return { ok: false, error: 'Your shop is not approved for the market.' }
  }

  let data
  try {
    data = parseOrThrow(sellerProductSchema, input)
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Invalid product',
    }
  }

  /**
   * A shop lists inside the trade lines it was approved for, and nowhere else.
   * A cloth shop may file under Men's, Women's or Kids; it may not file under
   * Electronics unless an admin granted it that line too.
   *
   * The form only offers those categories, which is what an honest seller
   * sees — this is the copy that counts, because a server action is a public
   * endpoint and the form's `<select>` is a suggestion to anyone willing to
   * skip it. Both sides read `categoriesInLines`, so neither can drift.
   *
   * A shop approved before lines existed has none at all, and
   * `getApplicationLines` had nothing to fall back to either. Rather than
   * locking it out of its own dashboard it falls back to "any wholesale
   * category" — still narrower than no check, since a storefront-only category
   * is refused either way, and an admin can grant it lines from the review
   * screen.
   */
  const wholesale = await getWholesaleCategories()

  if (lines.length > 0) {
    if (!isInAnyLine(wholesale, lines, data.category)) {
      return {
        ok: false,
        error: 'You can only list products in a trade line you are approved for.',
      }
    }
  } else if (!wholesale.some((category) => category.slug === data.category)) {
    return { ok: false, error: 'Pick a category from the list.' }
  }

  const values = {
    // The seller types one name; both languages get it rather than shipping an
    // empty Bangla string into a jsonb column the UI reads blindly.
    name: { en: data.name, bn: data.name },
    price: data.price,
    image: data.image,
    category: data.category,
    catalogueSlug: await resolveCatalogue(data.category, data.catalogue),
    sizes: data.sizes,
    description: data.description
      ? { en: data.description, bn: data.description }
      : null,
    stock: data.stock,
    moq: data.moq,
    // Never settable by a seller: a marketplace listing cannot carry a sale
    // badge or a struck-through price, which are the store's own promotions.
    oldPrice: null,
    badge: null,
    colors: null,
  }
  // `commission_pct` is load-bearing by its *absence* from `values` above:
  // Drizzle only writes the columns listed, so a seller editing their own
  // listing cannot touch the rate the store agreed with them. Do not "tidy"
  // this into a spread of the whole row. `approval_status` is the same kind of
  // column — a seller may move it to `pending` and nowhere else, which is what
  // the two branches below spell out.

  if (data.id) {
    /**
     * An edit keeps the listing's standing, with one exception: saving a
     * *rejected* listing is the resubmission, so it goes back into the queue
     * with the old reason cleared.
     *
     * Deliberately not "every edit re-enters review". A seller correcting a
     * stock count would then take their own live product off the market until
     * an admin looked at it, which turns the ordinary act of keeping a listing
     * accurate into a reason not to. `suspended` is untouched either way — that
     * is the admin's state, and a seller must not be able to save their way out
     * of it.
     *
     * Written as CASE expressions rather than a read-then-write: on the right
     * of a SET, a column is its pre-update value, so this decides and applies
     * in one statement with no room for a race between the two.
     */
    const wasRejected = sql`${products.approvalStatus} = 'rejected'`
    const [updated] = await db
      .update(products)
      .set({
        ...values,
        approvalStatus: sql`case when ${wasRejected} then 'pending' else ${products.approvalStatus} end`,
        rejectionReason: sql`case when ${wasRejected} then null else ${products.rejectionReason} end`,
        submittedAt: sql`case when ${wasRejected} then now() else ${products.submittedAt} end`,
      })
      .where(and(eq(products.id, data.id), eq(products.sellerId, shop.id)))
      .returning({ id: products.id })

    if (!updated) return { ok: false, error: 'That listing is not yours.' }
    await saveAttributes(data.id, data.category, data.attributes)
  } else {
    const id = await uniqueProductId(data.name)
    await db.insert(products).values({
      ...values,
      id,
      sellerId: shop.id,
      // The column defaults to `approved` for house stock and for every row
      // that predates the queue; a seller's new listing is the one case that
      // has to wait for a verdict, so it says so here rather than relying on a
      // default that means the opposite.
      approvalStatus: 'pending',
      submittedAt: new Date(),
    })
    await saveAttributes(id, data.category, data.attributes)
  }

  refresh()
  if (data.id) revalidatePath(`/product/${data.id}`)
  return { ok: true }
}

export async function deleteSellerProduct(id: string): Promise<Result> {
  let shop
  try {
    ;({ shop } = await requireApprovedWholesaler())
  } catch {
    return { ok: false, error: 'Your shop is not approved for the market.' }
  }

  const [deleted] = await db
    .delete(products)
    .where(and(eq(products.id, id), eq(products.sellerId, shop.id)))
    .returning({ id: products.id })

  if (!deleted) return { ok: false, error: 'That listing is not yours.' }

  refresh()
  return { ok: true }
}
