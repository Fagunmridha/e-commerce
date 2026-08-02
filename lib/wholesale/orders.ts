import 'server-only'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { orderItems, orders, products } from '@/lib/db/schema'
import type { OrderStatus } from '@/lib/orders'
import type { Localized } from '@/lib/i18n'

/** One line of an order, restricted to the shop that listed the product. */
export type SellerOrderLine = {
  name: Localized
  image: string
  quantity: number
  size: string | null
  colorEn: string | null
  unitPrice: number
}

/**
 * An order as its *seller* sees it: the buyer's delivery details and the order
 * status, but only the lines that came out of this shop, and only the money
 * those lines are worth. Shipping and any coupon belong to the whole order, so
 * they are deliberately absent — a seller's `subtotal` is what the store owes
 * them for their goods, not what the buyer paid.
 */
export type SellerOrder = {
  id: string
  orderNumber: string
  status: OrderStatus
  /** ISO string — this crosses into a client component. */
  placedAt: string
  buyerName: string
  buyerPhone: string
  buyerCity: string
  items: SellerOrderLine[]
  /** Pieces sold from this shop in this order. */
  pieces: number
  /** Value of this shop's lines only. */
  subtotal: number
}

/**
 * Every order containing at least one of this shop's listings, newest first.
 *
 * Attribution runs through `products.seller_id` rather than a snapshot on the
 * line, so one join answers it for all existing data. The trade-off: deleting a
 * listing nulls `order_items.product_id`, and that line drops out of the shop's
 * history. Snapshotting the seller onto `order_items` at checkout would fix
 * that, and needs a migration.
 *
 * One round trip for the lot — the rows come back flat and are grouped here,
 * since the database is the slow part, not the loop.
 */
export async function getSellerOrders(
  sellerId: string,
  limit = 100,
): Promise<SellerOrder[]> {
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      placedAt: orders.placedAt,
      buyerName: orders.name,
      buyerPhone: orders.phone,
      buyerCity: orders.city,
      name: orderItems.nameSnapshot,
      image: orderItems.imageSnapshot,
      quantity: orderItems.quantity,
      size: orderItems.size,
      colorEn: orderItems.colorEn,
      unitPrice: orderItems.unitPrice,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(products, eq(products.id, orderItems.productId))
    .where(eq(products.sellerId, sellerId))
    .orderBy(desc(orders.placedAt))

  const byOrder = new Map<string, SellerOrder>()

  for (const row of rows) {
    const line: SellerOrderLine = {
      name: row.name,
      image: row.image,
      quantity: row.quantity,
      size: row.size,
      colorEn: row.colorEn,
      unitPrice: row.unitPrice,
    }

    const existing = byOrder.get(row.id)
    if (existing) {
      existing.items.push(line)
      existing.pieces += row.quantity
      existing.subtotal += row.unitPrice * row.quantity
      continue
    }

    byOrder.set(row.id, {
      id: row.id,
      orderNumber: row.orderNumber,
      status: row.status,
      placedAt: row.placedAt.toISOString(),
      buyerName: row.buyerName,
      buyerPhone: row.buyerPhone,
      buyerCity: row.buyerCity,
      items: [line],
      pieces: row.quantity,
      subtotal: row.unitPrice * row.quantity,
    })
  }

  return [...byOrder.values()].slice(0, limit)
}
