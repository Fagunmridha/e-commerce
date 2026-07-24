import 'server-only'
import { desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { orderItems, orders, products, type OrderRow } from '@/lib/db/schema'
import { getShippingCost } from '@/lib/currency'
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

  let subtotal = 0
  const lines = input.items.flatMap((item) => {
    const product = byId.get(item.productId)
    if (!product) return []
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

  const shipping = getShippingCost(subtotal)
  const total = subtotal + shipping
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
      shipping,
      total,
      itemCount,
    })
    .returning()

  await db.insert(orderItems).values(
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
  )

  // Decrement stock, never below zero.
  for (const line of lines) {
    await db
      .update(products)
      .set({ stock: sql`greatest(0, ${products.stock} - ${line.quantity})` })
      .where(eq(products.id, line.productId))
  }

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

export async function getAllOrders(): Promise<OrderRow[]> {
  return db.select().from(orders).orderBy(desc(orders.placedAt))
}

export type OrderStatus = OrderRow['status']

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  await db.update(orders).set({ status }).where(eq(orders.id, orderId))
}
