'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import { requireApprovedWholesaler } from '@/lib/wholesalers'
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
  try {
    ;({ shop } = await requireApprovedWholesaler())
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

  const values = {
    // The seller types one name; both languages get it rather than shipping an
    // empty Bangla string into a jsonb column the UI reads blindly.
    name: { en: data.name, bn: data.name },
    price: data.price,
    image: data.image,
    category: data.category,
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
  // this into a spread of the whole row.

  if (data.id) {
    const [updated] = await db
      .update(products)
      .set(values)
      .where(and(eq(products.id, data.id), eq(products.sellerId, shop.id)))
      .returning({ id: products.id })

    if (!updated) return { ok: false, error: 'That listing is not yours.' }
  } else {
    await db
      .insert(products)
      .values({ ...values, id: await uniqueProductId(data.name), sellerId: shop.id })
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
