'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { productImages, products, users } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/auth'
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
  roleSchema,
  userIdSchema,
  uuidSchema,
} from '@/lib/validation/admin'
import { parseOrThrow } from '@/lib/validation/shared'
import type { Localized } from '@/lib/i18n'
import type { CategorySlug, ProductColor } from '@/lib/types'

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
  badge?: 'new' | 'sale' | null
  sizes?: string[] | null
  colors?: ProductColor[] | null
  /** Per-product selling points shown on the detail page. */
  highlights?: Localized[] | null
  /** Extra gallery shots. `image` above stays the primary photo. */
  gallery?: string[] | null
  description?: Localized | null
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
