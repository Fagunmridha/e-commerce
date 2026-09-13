'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { and, eq, isNotNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { productImages, products, users } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/auth'
import { resolveCatalogue } from '@/lib/catalogues'
import {
  attributeWrites,
  definitionsForCategory,
  getAllAttributeDefinitions,
} from '@/lib/attributes'
import { getAllCategories } from '@/lib/products'
import {
  setAdvanceStatus,
  updateOrderStatus,
  type AdvanceVerdict,
  type OrderStatus,
} from '@/lib/orders'
import {
  advanceVerdictSchema,
  orderStatusSchema,
  productSchema,
  productVerdictSchema,
  roleSchema,
  userIdSchema,
  uuidSchema,
} from '@/lib/validation/admin'
import { parseOrThrow } from '@/lib/validation/shared'
import type { Localized } from '@/lib/i18n'
import type { ApprovalStatus, CategorySlug, ProductColor } from '@/lib/types'

/**
 * Server actions are public HTTP endpoints. `requireAdmin()` keeps strangers
 * out, but every payload is still parsed before it reaches the database —
 * otherwise a stale client could persist a negative price or a NaN.
 */

export async function setUserRole(
  userId: number,
  role: 'customer' | 'admin',
): Promise<void> {
  const me = await requireAdmin()
  const id = parseOrThrow(userIdSchema, userId)
  const nextRole = parseOrThrow(roleSchema, role)

  // Guard against an admin accidentally removing their own last-admin access.
  if (me.id === id && nextRole !== 'admin') {
    throw new Error('You cannot remove your own admin role')
  }

  await db.update(users).set({ role: nextRole }).where(eq(users.id, id))
  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${id}`)
}

export type ProductInput = {
  id: string
  name: Localized
  price: number
  oldPrice?: number | null
  image: string
  category: CategorySlug
  /**
   * The catalogue within `category`, or null for stock the admin has not
   * sorted. Dropped to null server-side if it does not belong to `category`.
   */
  catalogue?: string | null
  badge?: 'new' | 'sale' | null
  sizes?: string[] | null
  colors?: ProductColor[] | null
  /** Per-product selling points shown on the detail page. */
  highlights?: Localized[] | null
  /** Extra gallery shots. `image` above stays the primary photo. */
  gallery?: string[] | null
  description?: Localized | null
  /**
   * Answers to the per-category fields from /admin/attributes. Which
   * definitions may be answered depends on `category`, so the list is filtered
   * server-side rather than trusted.
   */
  attributes?: { definitionId: string; value: string }[] | null
  /** Pieces available; on a pre-order row, the allocation still open. */
  stock: number
  /** Minimum pieces per order. Omit or 1 for no minimum. */
  moq?: number | null
  /** Marks the row as upcoming stock, taken on pre-order. */
  preorder?: boolean | null
  /** `YYYY-MM-DD`. Required when `preorder` is true. */
  preorderShipsAt?: string | null
  /** Advance share, 0–100. Null uses the store default. */
  preorderAdvancePct?: number | null
  /**
   * The store's commission on a marketplace listing, 0–100. Null uses the store
   * default. Only meaningful when the row has a `seller_id`.
   *
   * The form must always send the listing's current value: `upsertProduct`
   * rewrites the whole row, so omitting it on an unrelated edit would null the
   * rate. Already-placed orders are unaffected either way — they carry their
   * own snapshot on `order_items`.
   */
  commissionPct?: number | null
}

export async function upsertProduct(input: ProductInput): Promise<void> {
  await requireAdmin()
  const data = parseOrThrow(productSchema, input)

  const values = {
    id: data.id,
    name: data.name,
    price: data.price,
    oldPrice: data.oldPrice,
    image: data.image,
    category: data.category as CategorySlug,
    catalogueSlug: await resolveCatalogue(
      data.category as CategorySlug,
      data.catalogue,
    ),
    badge: data.badge,
    sizes: data.sizes,
    colors: data.colors,
    highlights: data.highlights,
    description: data.description,
    stock: data.stock,
    moq: data.moq,
    preorder: data.preorder,
    // Cleared when the toggle is off, so a row that stops being a pre-order
    // does not keep advertising a stale ship date if it is turned back on.
    preorderShipsAt: data.preorder ? data.preorderShipsAt : null,
    preorderAdvancePct: data.preorder ? data.preorderAdvancePct : null,
    commissionPct: data.commissionPct,
  }

  await db
    .insert(products)
    .values(values)
    .onConflictDoUpdate({ target: products.id, set: values })

  // Replace the gallery wholesale. Neon's HTTP driver has no interactive
  // transactions, but `batch` maps to a real one — without it a failure between
  // the delete and the insert would wipe the gallery and put nothing back.
  //
  // `values([])` throws in Drizzle, so an emptied gallery is a delete on its own.
  if (data.gallery.length) {
    await db.batch([
      db.delete(productImages).where(eq(productImages.productId, data.id)),
      db.insert(productImages).values(
        data.gallery.map((url, index) => ({
          productId: data.id,
          url,
          position: index,
        })),
      ),
    ])
  } else {
    await db.delete(productImages).where(eq(productImages.productId, data.id))
  }

  /**
   * The per-category fields from /admin/attributes.
   *
   * Resolved from the category the product is actually being filed under, never
   * from the payload's own list — `attributeWrites` keeps only definitions that
   * apply, so an answer posted against the wrong branch is dropped rather than
   * stored. Unfiltered categories here on purpose: an admin editing a product in
   * a category they have just switched off must still be able to fill its
   * fields in.
   */
  const [definitions, categories] = await Promise.all([
    getAllAttributeDefinitions(),
    getAllCategories(),
  ])
  await db.batch(
    attributeWrites(
      data.id,
      data.attributes,
      definitionsForCategory(definitions, categories, data.category),
    ),
  )

  updateTag('catalogue')
  revalidatePath('/admin/products')
  revalidatePath('/admin/preorders')
  revalidatePath('/shop')
  revalidatePath(`/product/${data.id}`)
}

export async function deleteProduct(id: string): Promise<void> {
  await requireAdmin()
  await db.delete(products).where(eq(products.id, id))
  updateTag('catalogue')
  revalidatePath('/admin/products')
  revalidatePath('/shop')
}

/**
 * The verdict on one marketplace listing.
 *
 * Scoped to `seller_id IS NOT NULL`, which is not decoration: house stock is
 * the admin's own and has no queue to be in, and without the clause a stray id
 * would let this screen suspend the store's own products through a workflow
 * built for somebody else's.
 *
 * A reason is required to reject and discarded otherwise — a seller cannot act
 * on "no", and a stale reason left sitting on an approved listing would read as
 * a complaint about stock that is live.
 */
export async function reviewProduct(
  id: string,
  status: ApprovalStatus,
  reason: string | null,
): Promise<void> {
  const me = await requireAdmin()
  const data = parseOrThrow(productVerdictSchema, { id, status, reason })

  const [updated] = await db
    .update(products)
    .set({
      approvalStatus: data.status,
      rejectionReason: data.status === 'rejected' ? data.reason : null,
      reviewedAt: new Date(),
      reviewedByUserId: me.id,
    })
    .where(and(eq(products.id, data.id), isNotNull(products.sellerId)))
    .returning({ id: products.id })

  if (!updated) throw new Error('That is not a marketplace listing')

  updateTag('catalogue')
  revalidatePath('/admin/products')
  revalidatePath('/wholesale/market')
  revalidatePath('/wholesale/dashboard')
  revalidatePath(`/product/${data.id}`)
}

export async function setOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  const me = await requireAdmin()
  const id = parseOrThrow(uuidSchema, orderId)
  const nextStatus = parseOrThrow(orderStatusSchema, status)

  // Recording who made the change is the point of the timeline.
  await updateOrderStatus(id, nextStatus, me.id)
  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${id}`)
}

/**
 * Records whether a booking's mobile-money advance actually arrived. There is
 * no gateway to ask, so an admin matches the transaction ID against their own
 * bKash/Nagad statement and rules on it here.
 *
 * `currentOrderStatus` comes from the caller because the page already has the
 * order loaded, and it is what the timeline entry is stamped with — see
 * `setAdvanceStatus`.
 */
export async function verifyAdvance(
  orderId: string,
  verdict: AdvanceVerdict,
  currentOrderStatus: OrderStatus,
): Promise<void> {
  const me = await requireAdmin()
  const id = parseOrThrow(uuidSchema, orderId)
  const nextVerdict = parseOrThrow(advanceVerdictSchema, verdict)
  const status = parseOrThrow(orderStatusSchema, currentOrderStatus)

  await setAdvanceStatus(id, nextVerdict, status, me.id)
  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${id}`)
  revalidatePath('/admin/preorders')
}
