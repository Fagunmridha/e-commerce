'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import { requireApprovedWholesaler } from '@/lib/wholesalers'
import { checkCatalogue } from '@/lib/catalogues'
import { categoriesInLine } from '@/lib/category-tree'
import {
  attributeWrites,
  definitionsForCategory,
  getAllAttributeDefinitions,
} from '@/lib/attributes'
import { getAllCategories, getWholesaleCategories } from '@/lib/products'
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
   * The permission chain, checked here and nowhere weaker:
   *
   *   shop approved?  →  trade line granted & open?  →  category under that
   *   line?  →  catalogue under that category & open?  →  allow.
   *
   * The form only ever offers paths that pass, which is what an honest seller
   * sees. This is the copy that counts: a server action is a public endpoint,
   * and "tradeLine = electronics, category = women, catalogue = saree" posted
   * by hand is refused at the first link that does not hold — never repaired
   * into something half-valid and saved.
   *
   * A shop with no granted line may list nothing. There used to be a fallback
   * to "any wholesale category" for shops approved before lines existed; it
   * was a migration crutch, and it is exactly the hole the chain exists to
   * close. Such a shop sees a notice on its dashboard until an admin grants it.
   */
  if (lines.length === 0) {
    return {
      ok: false,
      error: 'No trade line has been approved for your shop yet.',
    }
  }

  const [openTrade, allCategories] = await Promise.all([
    // Active and open to trade — what a *new* filing may use.
    getWholesaleCategories(),
    // Every row, so an edit can keep a category an admin has since switched off.
    getAllCategories(),
  ])

  // Link 2 — the line is one this shop was granted, and is still open.
  if (!lines.includes(data.tradeLine)) {
    return { ok: false, error: 'Your shop is not approved for that trade line.' }
  }
  if (!openTrade.some((category) => category.slug === data.tradeLine)) {
    return { ok: false, error: 'That trade line is closed to new listings.' }
  }

  // An edit that keeps the category it already had may keep it even if an
  // admin has since switched it off: "inactive" stops new filings, it must not
  // strand a live listing so its seller cannot correct the stock count.
  let existing: { category: string; catalogueSlug: string | null } | undefined
  if (data.id) {
    ;[existing] = await db
      .select({
        category: products.category,
        catalogueSlug: products.catalogueSlug,
      })
      .from(products)
      .where(and(eq(products.id, data.id), eq(products.sellerId, shop.id)))
    if (!existing) return { ok: false, error: 'That listing is not yours.' }
  }
  const keepingCategory = existing?.category === data.category

  // Link 3 — the category sits under that line. Checked against the trade-open
  // list either way; only the *status* filter is relaxed for a kept category.
  const tradeScoped = allCategories.filter(
    (category) => category.scope === 'wholesale' || category.scope === 'both',
  )
  const pool = keepingCategory
    ? tradeScoped.filter(
        (category) => category.status === 'active' || category.slug === data.category,
      )
    : openTrade
  if (
    !categoriesInLine(pool, data.tradeLine).some(
      (category) => category.slug === data.category,
    )
  ) {
    return {
      ok: false,
      error: 'That category does not belong to the chosen trade line.',
    }
  }

  // Link 4 — the catalogue sits under that category, and is open.
  const catalogueCheck = await checkCatalogue(data.category, data.catalogue, {
    allowInactive:
      keepingCategory && existing?.catalogueSlug === data.catalogue,
  })
  if (!catalogueCheck.ok) return catalogueCheck

  const values = {
    // The seller types one name; both languages get it rather than shipping an
    // empty Bangla string into a jsonb column the UI reads blindly.
    name: { en: data.name, bn: data.name },
    price: data.price,
    // The MRP. A card strikes it through beside the wholesale price and states
    // the percentage below it — see `discountPercent` in lib/currency.ts.
    oldPrice: data.mrp,
    image: data.image,
    category: data.category,
    catalogueSlug: catalogueCheck.slug,
    sizes: data.sizes,
    colors: data.colors
      ? data.colors.map((colour) => ({ name: { en: colour, bn: colour } }))
      : null,
    description: data.description
      ? { en: data.description, bn: data.description }
      : null,
    stock: data.stock,
    moq: data.moq,
    // Never settable by a seller: the "sale"/"new" badge is the store's own
    // promotion, not a fact about the goods.
    badge: null,
  }
  // `commission_pct` is load-bearing by its *absence* from `values` above:
  // Drizzle only writes the columns listed, so a seller editing their own
  // listing cannot touch the rate the store agreed with them. Do not "tidy"
  // this into a spread of the whole row. `approval_status` is the same kind of
  // column — a seller may move it to `draft` or `pending` and nowhere else,
  // which is what the two branches below spell out.

  if (data.id) {
    /**
     * An edit keeps the listing's standing, with one exception: submitting a
     * *draft* or a *rejected* listing sends it into the queue, with any old
     * reason cleared. Saving without submitting leaves a draft a draft.
     *
     * Deliberately not "every edit re-enters review". A seller correcting a
     * stock count would then take their own live product off the market until
     * an admin looked at it, which turns keeping a listing accurate into a
     * reason not to. `suspended` is untouched either way — that is the admin's
     * state, and a seller must not be able to save their way out of it.
     *
     * CASE expressions rather than read-then-write: on the right of a SET a
     * column is its pre-update value, so this decides and applies in one
     * statement with no room for a race between the two.
     */
    const toReview = data.submit
      ? sql`${products.approvalStatus} in ('draft', 'rejected')`
      : sql`false`
    const [updated] = await db
      .update(products)
      .set({
        ...values,
        approvalStatus: sql`case when ${toReview} then 'pending' else ${products.approvalStatus} end`,
        rejectionReason: sql`case when ${toReview} then null else ${products.rejectionReason} end`,
        submittedAt: sql`case when ${toReview} then now() else ${products.submittedAt} end`,
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
      // that predates the queue; a seller's listing is the one case that has
      // to wait, so it says so here rather than relying on a default that
      // means the opposite.
      approvalStatus: data.submit ? 'pending' : 'draft',
      submittedAt: data.submit ? new Date() : null,
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
