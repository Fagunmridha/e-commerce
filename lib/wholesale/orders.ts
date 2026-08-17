import 'server-only'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { orderItems, orders } from '@/lib/db/schema'
import { summariseSettlement } from '@/lib/commission'
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
 * An order as its *seller* sees it: the status and only the lines that came out
 * of this shop, priced at what those lines are worth to it.
 *
 * The buyer is deliberately absent — no name, no phone, not even a city, which
 * in a small town is close to an identity. The two wholesalers either side of a
 * trade must not learn each other exist: the seller knows the store bought the
 * goods, and the buyer knows the store sold them. The order number is the one
 * shared reference, which is all either of them needs to raise a query with the
 * store.
 *
 * Shipping and any coupon are absent for a different reason: they belong to the
 * whole order and are the store's own. A seller's `subtotal` is what the store
 * owes them for their goods, not what the buyer paid — and `commission` and
 * `payout` split that the way the settlement will.
 */
export type SellerOrder = {
  id: string
  orderNumber: string
  status: OrderStatus
  /** ISO string — this crosses into a client component. */
  placedAt: string
  items: SellerOrderLine[]
  /** Pieces sold from this shop in this order. */
  pieces: number
  /** Value of this shop's lines only. */
  subtotal: number
  /** The store's cut of that value, at the rates the lines were sold at. */
  commission: number
  /** What the shop is owed: `subtotal - commission`. */
  payout: number
}

/**
 * Every order containing at least one of this shop's listings, newest first.
 *
 * Attribution runs through the `order_items.seller_id` snapshot written at
 * checkout, not through a live join on `products.seller_id`. That join used to
 * mean deleting a listing nulled `order_items.product_id` and dropped the line
 * out of the shop's history; the snapshot is what fixed it, and it is also what
 * every settlement is grouped by, so the two can never disagree.
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
      name: orderItems.nameSnapshot,
      image: orderItems.imageSnapshot,
      quantity: orderItems.quantity,
      size: orderItems.size,
      colorEn: orderItems.colorEn,
      unitPrice: orderItems.unitPrice,
      commissionPct: orderItems.commissionPct,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(eq(orderItems.sellerId, sellerId))
    .orderBy(desc(orders.placedAt))

  // Grouped first, priced second: `summariseSettlement` rounds per line and
  // then sums, so accumulating money as we go would give a different — and
  // wrong — answer from the one the settlement document prints.
  const byOrder = new Map<
    string,
    Omit<SellerOrder, 'subtotal' | 'commission' | 'payout' | 'pieces'> & {
      priced: { unitPrice: number; quantity: number; commissionPct: number | null }[]
    }
  >()

  for (const row of rows) {
    const line: SellerOrderLine = {
      name: row.name,
      image: row.image,
      quantity: row.quantity,
      size: row.size,
      colorEn: row.colorEn,
      unitPrice: row.unitPrice,
    }
    const priced = {
      unitPrice: row.unitPrice,
      quantity: row.quantity,
      commissionPct: row.commissionPct,
    }

    const existing = byOrder.get(row.id)
    if (existing) {
      existing.items.push(line)
      existing.priced.push(priced)
      continue
    }

    byOrder.set(row.id, {
      id: row.id,
      orderNumber: row.orderNumber,
      status: row.status,
      placedAt: row.placedAt.toISOString(),
      items: [line],
      priced: [priced],
    })
  }

  return [...byOrder.values()].slice(0, limit).map(({ priced, ...order }) => {
    const summary = summariseSettlement(priced)
    return {
      ...order,
      pieces: summary.pieces,
      subtotal: summary.gross,
      commission: summary.commission,
      payout: summary.payout,
    }
  })
}
