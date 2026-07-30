import 'server-only'
import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  orderEvents,
  orderItems,
  orders,
  products,
  wholesalerApplications,
  type OrderEventRow,
  type OrderRow,
} from '@/lib/db/schema'
import { computeTotals } from '@/lib/coupon-math'
import { checkCoupon, redeemCoupon } from '@/lib/coupons'
import type { Localized } from '@/lib/i18n'
import type { PaymentMethod } from '@/lib/order'

export function createOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6)
  return `CP-${stamp}`
}

export type OrderItemInput = {
  productId: string
  quantity: number
  size?: string
  colorEn?: string
}

export type CreateOrderInput = {
  name: string
  phone: string
  address: string
  city: string
  notes?: string
  paymentMethod: PaymentMethod
  items: OrderItemInput[]
  /** Null for guest checkout. */
  userId?: number | null
  /**
   * Only the code travels from the client — never the discount amount. It is
   * re-validated and re-priced here, exactly like item prices are.
   */
  couponCode?: string | null
}

export type OrderLine = {
  name: Localized
  image: string
  quantity: number
  size: string | null
  colorEn: string | null
  unitPrice: number
}

export type OrderWithItems = OrderRow & { items: OrderLine[] }

/**
 * Creates an order from a cart. Prices are recomputed from the database — the
 * client's numbers are never trusted — and stock is decremented in the same go.
 */
export async function createOrder(
  input: CreateOrderInput,
): Promise<{ orderNumber: string }> {
  if (input.items.length === 0) {
    throw new Error('Cannot place an empty order')
  }

  const ids = [...new Set(input.items.map((item) => item.productId))]
  const rows = await db.select().from(products).where(inArray(products.id, ids))
  const byId = new Map(rows.map((row) => [row.id, row]))

  // Marketplace lines are only sellable while their shop is still approved.
  // Suspension hides listings from the market but does not delete the rows, so
  // without this a stale cart would still get a paused shop's stock through.
  const sellerIds = [
    ...new Set(rows.flatMap((row) => (row.sellerId ? [row.sellerId] : []))),
  ]
  const liveShops = sellerIds.length
    ? new Set(
        (
          await db
            .select({ id: wholesalerApplications.id })
            .from(wholesalerApplications)
            .where(
              and(
                inArray(wholesalerApplications.id, sellerIds),
                eq(wholesalerApplications.status, 'approved'),
              ),
            )
        ).map((row) => row.id),
      )
    : new Set<string>()

  let subtotal = 0
  const lines = input.items.flatMap((item) => {
    const product = byId.get(item.productId)
    if (!product) return []

    if (product.sellerId && !liveShops.has(product.sellerId)) {
      throw new Error(`${product.id} is no longer for sale`)
    }

    // The cart clamps this too, but that is a courtesy and this is the rule —
    // the client's quantities are no more trusted than its prices.
    if (item.quantity < product.moq) {
      throw new Error(
        `${product.id} has a minimum order of ${product.moq} pieces`,
      )
    }

    subtotal += product.price * item.quantity
    return [
      {
        productId: product.id,
        nameSnapshot: product.name,
        imageSnapshot: product.image,
        quantity: item.quantity,
        size: item.size ?? null,
        colorEn: item.colorEn ?? null,
        unitPrice: product.price,
      },
    ]
  })

  if (lines.length === 0) {
    throw new Error('None of the cart items exist any more')
  }

  // Re-validate the code against the subtotal we just computed, then reserve a
  // redemption. `redeemCoupon` is a conditional UPDATE, so if the last use went
  // to someone else between preview and submit, it comes back null and the
  // order simply prices without the discount — better than losing the sale.
  let coupon = null
  let couponId: string | null = null

  if (input.couponCode) {
    const check = await checkCoupon(input.couponCode, subtotal)
    if (check.ok) {
      couponId = await redeemCoupon(check.coupon.code)
      if (couponId) coupon = check.coupon
    }
  }

  const { discount, shipping, total } = computeTotals(subtotal, coupon)
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0)
  const orderNumber = createOrderNumber()

  const [order] = await db
    .insert(orders)
    .values({
      orderNumber,
      userId: input.userId ?? null,
      name: input.name,
      phone: input.phone,
      address: input.address,
      city: input.city,
      notes: input.notes ?? null,
      paymentMethod: input.paymentMethod,
      subtotal,
      discount,
      couponCode: coupon?.code ?? null,
      couponId,
      shipping,
      total,
      itemCount,
    })
    .returning()

  // Line items and the stock decrements go together in one transaction over
  // Neon's HTTP protocol. `db.transaction()` is unavailable on this driver,
  // but `batch` maps to a real transaction — without it a failure partway
  // through the old loop left stock decremented for some lines and not others.
  await db.batch([
    db.insert(orderItems).values(
      lines.map((line) => ({
        orderId: order.id,
        productId: line.productId,
        nameSnapshot: line.nameSnapshot,
        imageSnapshot: line.imageSnapshot,
        quantity: line.quantity,
        size: line.size,
        colorEn: line.colorEn,
        unitPrice: line.unitPrice,
      })),
    ),
    // Opens the timeline, so every order has a first event rather than the
    // history starting only once an admin touches it.
    db.insert(orderEvents).values({ orderId: order.id, status: 'pending' }),
    // Decrement stock, never below zero.
    ...lines.map((line) =>
      db
        .update(products)
        .set({ stock: sql`greatest(0, ${products.stock} - ${line.quantity})` })
        .where(eq(products.id, line.productId)),
    ),
  ])

  return { orderNumber }
}

async function attachItems(row: OrderRow): Promise<OrderWithItems> {
  const items = await db
    .select({
      name: orderItems.nameSnapshot,
      image: orderItems.imageSnapshot,
      quantity: orderItems.quantity,
      size: orderItems.size,
      colorEn: orderItems.colorEn,
      unitPrice: orderItems.unitPrice,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, row.id))

  return { ...row, items }
}

/**
 * Lines for many orders in one query. The per-order `attachItems` above is
 * fine for a single order page but becomes an N+1 the moment a list needs
 * item detail.
 */
export async function getOrderItemsByOrderIds(
  ids: string[],
): Promise<Map<string, OrderLine[]>> {
  const map = new Map<string, OrderLine[]>()
  if (ids.length === 0) return map

  const rows = await db
    .select({
      orderId: orderItems.orderId,
      name: orderItems.nameSnapshot,
      image: orderItems.imageSnapshot,
      quantity: orderItems.quantity,
      size: orderItems.size,
      colorEn: orderItems.colorEn,
      unitPrice: orderItems.unitPrice,
    })
    .from(orderItems)
    .where(inArray(orderItems.orderId, ids))

  for (const { orderId, ...line } of rows) {
    const existing = map.get(orderId)
    if (existing) existing.push(line)
    else map.set(orderId, [line])
  }

  return map
}

export async function getOrderByNumber(
  orderNumber: string,
): Promise<OrderWithItems | null> {
  const [row] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
  return row ? attachItems(row) : null
}

export async function getUserOrders(userId: number): Promise<OrderRow[]> {
  return db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.placedAt))
}

/** Kept for the "export everything" path; the admin list uses `getOrdersPage`. */
export async function getAllOrders(): Promise<OrderRow[]> {
  return db.select().from(orders).orderBy(desc(orders.placedAt))
}

export type OrderStatus = OrderRow['status']

export const ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const

export type OrderQuery = {
  status?: OrderStatus
  /** Matches order number, customer name or phone. */
  q?: string
  from?: Date
  to?: Date
  page?: number
  pageSize?: number
}

/**
 * Filtering and paging in SQL. The admin list used to pull every order and
 * filter in JavaScript, which is fine at 10 orders and not at 10,000.
 */
export async function getOrdersPage(
  query: OrderQuery = {},
): Promise<{ rows: OrderRow[]; total: number; pageCount: number }> {
  const pageSize = Math.min(Math.max(query.pageSize ?? 20, 1), 100)
  const page = Math.max(query.page ?? 1, 1)

  const filters = []
  if (query.status) filters.push(eq(orders.status, query.status))
  if (query.from) filters.push(gte(orders.placedAt, query.from))
  if (query.to) filters.push(lte(orders.placedAt, query.to))

  const term = query.q?.trim()
  if (term) {
    const like = `%${term}%`
    filters.push(
      or(
        ilike(orders.orderNumber, like),
        ilike(orders.name, like),
        ilike(orders.phone, like),
      ),
    )
  }

  const where = filters.length ? and(...filters) : undefined

  const [rows, [totals]] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(where)
      .orderBy(desc(orders.placedAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ n: count() }).from(orders).where(where),
  ])

  const total = totals?.n ?? 0
  return { rows, total, pageCount: Math.max(1, Math.ceil(total / pageSize)) }
}

/** One GROUP BY for the status pills, instead of five passes over every row. */
export async function getOrderStatusCounts(): Promise<
  Record<OrderStatus | 'all', number>
> {
  const rows = await db
    .select({ status: orders.status, n: count() })
    .from(orders)
    .groupBy(orders.status)

  const counts = {
    all: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  }

  for (const row of rows) {
    counts[row.status] = row.n
    counts.all += row.n
  }

  return counts
}

export async function getOrderById(id: string): Promise<OrderWithItems | null> {
  const [row] = await db.select().from(orders).where(eq(orders.id, id))
  return row ? attachItems(row) : null
}

export async function getOrderEvents(orderId: string): Promise<OrderEventRow[]> {
  return db
    .select()
    .from(orderEvents)
    .where(eq(orderEvents.orderId, orderId))
    .orderBy(asc(orderEvents.createdAt))
}

/**
 * Moves an order and records why. The update and the event go in one `batch`
 * so the history can never disagree with `orders.status`.
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  actorUserId?: number | null,
  note?: string | null,
): Promise<void> {
  await db.batch([
    db.update(orders).set({ status }).where(eq(orders.id, orderId)),
    db.insert(orderEvents).values({
      orderId,
      status,
      note: note ?? null,
      actorUserId: actorUserId ?? null,
    }),
  ])
}
