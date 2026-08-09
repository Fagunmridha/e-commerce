import 'server-only'
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
} from 'drizzle-orm'
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
import type { DeliveryZone } from '@/lib/currency'
import { checkCoupon, redeemCoupon } from '@/lib/coupons'
import { advancePct, splitPayment } from '@/lib/preorder'
import type { Localized } from '@/lib/i18n'
import type { AdvanceInput, PaymentMethod } from '@/lib/order'

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
  /** Which flat rate delivery is charged at. Priced here, never sent as money. */
  zone: DeliveryZone
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
  /**
   * Required on a pre-order, ignored otherwise. Like `couponCode`, only the
   * *evidence* travels from the client — the amount owed is recomputed here
   * from the product's percentage, so a crafted request cannot book a ৳2,400
   * item by claiming it paid ৳1.
   */
  advance?: AdvanceInput
}

export type OrderLine = {
  name: Localized
  image: string
  quantity: number
  size: string | null
  colorEn: string | null
  unitPrice: number
  /** `YYYY-MM-DD` on a pre-ordered line, null on shelf stock. */
  preorderShipsAt: string | null
  /**
   * The shop that listed this product, or null for the store's own stock. Read
   * live through `products.seller_id`, so it is null once the listing itself is
   * deleted — the line survives on its snapshots, the attribution does not.
   */
  sellerName?: string | null
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
        preorder: product.preorder,
        // Snapshotted, so moving the product's date later never rewrites what
        // this customer was promised.
        preorderShipsAt: product.preorder ? product.preorderShipsAt : null,
        // Read from the product row, never from the request. Kept per line so
        // two pre-orders with different percentages still price correctly.
        advancePct: advancePct({
          preorderAdvancePct: product.preorderAdvancePct ?? undefined,
        }),
      },
    ]
  })

  if (lines.length === 0) {
    throw new Error('None of the cart items exist any more')
  }

  // Pre-order and shelf stock cannot share an order: the whole order would
  // otherwise sit undelivered for weeks behind one upcoming line. The cart
  // blocks this at the point of adding, but that is a courtesy — this is the
  // rule, and it is what lets `orders.preorder` be a property of the order.
  const preorderLines = lines.filter((line) => line.preorder)
  const isPreorder = preorderLines.length > 0

  if (isPreorder && preorderLines.length !== lines.length) {
    throw new Error(
      'Pre-order items must be checked out separately from in-stock items',
    )
  }

  // Reserve the allocation *before* the order exists. A plain read-then-write
  // would let two shoppers racing for the last piece both win it; the
  // conditional UPDATE below can only succeed for one of them.
  const reserved: { productId: string; quantity: number }[] = []
  for (const line of preorderLines) {
    const taken = await reservePreorderStock(line.productId, line.quantity)
    if (!taken) {
      // Hand back whatever this order already claimed, so a sell-out on the
      // second line does not strand the first line's pieces.
      await releasePreorderStock(reserved)
      throw new Error(`${line.productId} is fully booked`)
    }
    reserved.push({ productId: line.productId, quantity: line.quantity })
  }

  // Re-validate the code against the subtotal we just computed, then reserve a
  // redemption. `redeemCoupon` is a conditional UPDATE, so if the last use went
  // to someone else between preview and submit, it comes back null and the
  // order simply prices without the discount — better than losing the sale.
  let coupon = null
  let couponId: string | null = null

  // Not on a booking. A pre-order's advance is a percentage of the goods value,
  // and layering a discount underneath it turns "is the 30% before or after the
  // coupon?" into a question three surfaces would each have to answer the same
  // way. The lever for a pre-order incentive is the product's own price.
  if (input.couponCode && !isPreorder) {
    const check = await checkCoupon(input.couponCode, subtotal)
    if (check.ok) {
      couponId = await redeemCoupon(check.coupon.code)
      if (couponId) coupon = check.coupon
    }
  }

  const { discount, shipping, total } = computeTotals(
    subtotal,
    coupon,
    input.zone,
  )
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0)
  const orderNumber = createOrderNumber()

  // The advance can only be decided here, because it is capped at the final
  // total. The base is the goods value — delivery is collected in cash with the
  // balance, so quoting an advance on it would have the shopper pre-paying a
  // courier. `splitPayment` is the same function the booking sheet quotes from.
  //
  // The store currently runs pre-orders on pure cash on delivery
  // (`DEFAULT_ADVANCE_PCT` is 0), so this whole block usually settles on "no
  // advance" and the booking is priced exactly like an ordinary COD order.
  let advanceAmount = 0
  let dueAmount = 0
  let paymentStatus: 'none' | 'advance_pending' = 'none'

  if (isPreorder) {
    const goods = preorderLines.reduce(
      (sum, line) => sum + line.unitPrice * line.quantity,
      0,
    )
    const weighted = preorderLines.reduce(
      (sum, line) => sum + line.unitPrice * line.quantity * line.advancePct,
      0,
    )
    // Quantity-weighted, so a basket of two runs at different percentages lands
    // where each of them said it would rather than on an average of the two.
    const blendedPct = goods > 0 ? weighted / goods : 0
    const split = splitPayment(total, goods, blendedPct)

    // Only a booking that actually asks for money up front carries the advance
    // columns. A 0% run is a cash-on-delivery order in every respect, and
    // recording `advance_pending` on it would put a booking with nothing to
    // check into the admin's verification queue for ever.
    if (split.advance > 0) {
      if (!input.advance) {
        throw new Error('A pre-order needs advance payment details')
      }
      advanceAmount = split.advance
      dueAmount = split.due
      paymentStatus = 'advance_pending'
    }
  }

  const [order] = await db
    .insert(orders)
    .values({
      orderNumber,
      userId: input.userId ?? null,
      name: input.name,
      phone: input.phone,
      address: input.address,
      city: input.city,
      deliveryZone: input.zone,
      notes: input.notes ?? null,
      // A booking that took an advance is `advance_cod` whatever the client
      // asked for. One that did not is an ordinary cash-on-delivery order and
      // should not claim otherwise on the confirmation page.
      paymentMethod: advanceAmount > 0 ? 'advance_cod' : input.paymentMethod,
      subtotal,
      discount,
      couponCode: coupon?.code ?? null,
      couponId,
      shipping,
      total,
      itemCount,
      preorder: isPreorder,
      advanceAmount,
      dueAmount,
      paymentStatus,
      advanceMethod: advanceAmount > 0 ? (input.advance?.method ?? null) : null,
      advanceTrxId: advanceAmount > 0 ? (input.advance?.trxId ?? null) : null,
      advanceSenderPhone:
        advanceAmount > 0 ? (input.advance?.senderPhone ?? null) : null,
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
        preorderShipsAt: line.preorderShipsAt,
      })),
    ),
    // Opens the timeline, so every order has a first event rather than the
    // history starting only once an admin touches it.
    db.insert(orderEvents).values({ orderId: order.id, status: 'pending' }),
    // Decrement stock, never below zero. Pre-order lines are skipped: their
    // allocation was already claimed by the conditional UPDATE above, and
    // decrementing twice would take the run down at double rate.
    ...lines
      .filter((line) => !line.preorder)
      .map((line) =>
        db
          .update(products)
          .set({
            stock: sql`greatest(0, ${products.stock} - ${line.quantity})`,
          })
          .where(eq(products.id, line.productId)),
      ),
  ])

  return { orderNumber }
}

/**
 * Claims `quantity` pieces of a pre-order run, or returns false if they are no
 * longer there. The `stock >= quantity` test lives in the WHERE clause so the
 * check and the decrement are one statement — the same shape `redeemCoupon`
 * uses, and the only way two simultaneous bookings for the last piece cannot
 * both succeed.
 */
async function reservePreorderStock(
  productId: string,
  quantity: number,
): Promise<boolean> {
  const claimed = await db
    .update(products)
    .set({ stock: sql`${products.stock} - ${quantity}` })
    .where(
      and(
        eq(products.id, productId),
        eq(products.preorder, true),
        gte(products.stock, quantity),
      ),
    )
    .returning({ id: products.id })

  return claimed.length > 0
}

/**
 * Undoes reservations when a later line in the same order sells out. Plain
 * concurrent statements rather than `db.batch`: this is a compensating path
 * that only runs on the way to throwing, and each row is independent.
 */
async function releasePreorderStock(
  taken: { productId: string; quantity: number }[],
): Promise<void> {
  await Promise.all(
    taken.map((line) =>
      db
        .update(products)
        .set({ stock: sql`${products.stock} + ${line.quantity}` })
        .where(eq(products.id, line.productId)),
    ),
  )
}

async function attachItems(row: OrderRow): Promise<OrderWithItems> {
  // Left joins, both of them: a deleted product leaves `product_id` null, and
  // a house product has no seller. Either way the line still has to come back.
  const items = await db
    .select({
      name: orderItems.nameSnapshot,
      image: orderItems.imageSnapshot,
      quantity: orderItems.quantity,
      size: orderItems.size,
      colorEn: orderItems.colorEn,
      unitPrice: orderItems.unitPrice,
      preorderShipsAt: orderItems.preorderShipsAt,
      sellerName: wholesalerApplications.shopName,
    })
    .from(orderItems)
    .leftJoin(products, eq(products.id, orderItems.productId))
    .leftJoin(
      wholesalerApplications,
      eq(wholesalerApplications.id, products.sellerId),
    )
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
      preorderShipsAt: orderItems.preorderShipsAt,
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

export async function getOrderEvents(
  orderId: string,
): Promise<OrderEventRow[]> {
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

export type AdvanceVerdict = 'advance_paid' | 'advance_failed'

/**
 * Records an admin's verdict on a booking advance, having matched (or failed to
 * match) the transaction in their own bKash/Nagad statement. There is no
 * gateway to ask, so a human is the only oracle.
 *
 * The timeline entry carries `currentOrderStatus`, not the payment verdict:
 * `order_events.status` is constrained to the five *order* statuses, and
 * widening that enum to carry payment facts would blur what the timeline means.
 * The caller passes the current status in because the admin page already has
 * it, which saves a read before the write.
 */
export async function setAdvanceStatus(
  orderId: string,
  verdict: AdvanceVerdict,
  currentOrderStatus: OrderStatus,
  actorUserId: number,
): Promise<void> {
  await db.batch([
    db
      .update(orders)
      .set({
        paymentStatus: verdict,
        advanceVerifiedAt: new Date(),
        advanceVerifiedBy: actorUserId,
      })
      .where(eq(orders.id, orderId)),
    db.insert(orderEvents).values({
      orderId,
      status: currentOrderStatus,
      note:
        verdict === 'advance_paid'
          ? 'Booking advance verified'
          : 'Booking advance could not be verified',
      actorUserId,
    }),
  ])
}

/** Bookings whose advance an admin has not ruled on yet, oldest first — the
 *  queue they work through on /admin/preorders. */
export async function getPendingAdvanceOrders(limit = 20): Promise<OrderRow[]> {
  return db
    .select()
    .from(orders)
    .where(
      and(eq(orders.preorder, true), eq(orders.paymentStatus, 'advance_pending')),
    )
    .orderBy(asc(orders.placedAt))
    .limit(limit)
}
