import 'server-only'
import { and, count, desc, eq, gte, lt, sql, sum } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  categories,
  orderItems,
  orders,
  products,
  users,
} from '@/lib/db/schema'
import type { Localized } from '@/lib/i18n'
import type { PaymentMethod } from '@/lib/order'

/** Midnight today, in the server's timezone. */
function startOfToday(): Date {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function daysAgo(days: number): Date {
  const date = startOfToday()
  date.setDate(date.getDate() - days)
  return date
}

function num(value: unknown): number {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Percentage change between two periods. Returns null when the previous period
 * had nothing to compare against — showing "+100%" off a zero baseline would
 * overstate what actually happened.
 */
function trend(current: number, previous: number): number | null {
  if (previous === 0) return null
  return ((current - previous) / previous) * 100
}

export type DashboardStats = {
  revenue: { total: number; today: number; change: number | null }
  orders: { total: number; pending: number; change: number | null }
  products: { total: number; lowStock: number; outOfStock: number }
  customers: { total: number; change: number | null }
  /** Daily revenue and order counts for the last 14 days, gaps filled with 0. */
  sparkline: { date: string; revenue: number; orders: number }[]
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const monthStart = daysAgo(30)
  const prevMonthStart = daysAgo(60)

  const [
    [revenueRow],
    [todayRow],
    [thisMonthRow],
    [prevMonthRow],
    [orderRow],
    [pendingRow],
    [thisMonthOrders],
    [prevMonthOrders],
    [productRow],
    [lowStockRow],
    [outOfStockRow],
    [customerRow],
    [thisMonthCustomers],
    [prevMonthCustomers],
    daily,
  ] = await Promise.all([
    db.select({ v: sum(orders.total) }).from(orders),
    db
      .select({ v: sum(orders.total) })
      .from(orders)
      .where(gte(orders.placedAt, startOfToday())),
    db
      .select({ v: sum(orders.total) })
      .from(orders)
      .where(gte(orders.placedAt, monthStart)),
    db
      .select({ v: sum(orders.total) })
      .from(orders)
      .where(
        and(
          gte(orders.placedAt, prevMonthStart),
          lt(orders.placedAt, monthStart),
        ),
      ),
    db.select({ n: count() }).from(orders),
    db
      .select({ n: count() })
      .from(orders)
      .where(eq(orders.status, 'pending')),
    db
      .select({ n: count() })
      .from(orders)
      .where(gte(orders.placedAt, monthStart)),
    db
      .select({ n: count() })
      .from(orders)
      .where(
        and(
          gte(orders.placedAt, prevMonthStart),
          lt(orders.placedAt, monthStart),
        ),
      ),
    db.select({ n: count() }).from(products),
    db
      .select({ n: count() })
      .from(products)
      .where(and(sql`${products.stock} > 0`, sql`${products.stock} <= 5`)),
    db.select({ n: count() }).from(products).where(eq(products.stock, 0)),
    db.select({ n: count() }).from(users),
    db
      .select({ n: count() })
      .from(users)
      .where(gte(users.createdAt, monthStart)),
    db
      .select({ n: count() })
      .from(users)
      .where(
        and(
          gte(users.createdAt, prevMonthStart),
          lt(users.createdAt, monthStart),
        ),
      ),
    db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${orders.placedAt}), 'YYYY-MM-DD')`,
        revenue: sum(orders.total),
        orders: count(),
      })
      .from(orders)
      .where(gte(orders.placedAt, daysAgo(13)))
      .groupBy(sql`date_trunc('day', ${orders.placedAt})`),
  ])

  const byDay = new Map(
    daily.map((row) => [
      row.day,
      { revenue: num(row.revenue), orders: num(row.orders) },
    ]),
  )

  // Fill every day in the window so the sparkline reads as a real timeline
  // rather than compressing away the days with no orders.
  const sparkline = Array.from({ length: 14 }, (_, index) => {
    const date = daysAgo(13 - index)
    const key = date.toISOString().slice(0, 10)
    const found = byDay.get(key)
    return {
      date: key,
      revenue: found?.revenue ?? 0,
      orders: found?.orders ?? 0,
    }
  })

  return {
    revenue: {
      total: num(revenueRow?.v),
      today: num(todayRow?.v),
      change: trend(num(thisMonthRow?.v), num(prevMonthRow?.v)),
    },
    orders: {
      total: num(orderRow?.n),
      pending: num(pendingRow?.n),
      change: trend(num(thisMonthOrders?.n), num(prevMonthOrders?.n)),
    },
    products: {
      total: num(productRow?.n),
      lowStock: num(lowStockRow?.n),
      outOfStock: num(outOfStockRow?.n),
    },
    customers: {
      total: num(customerRow?.n),
      change: trend(num(thisMonthCustomers?.n), num(prevMonthCustomers?.n)),
    },
    sparkline,
  }
}

/** Revenue and order count per month for the last 12 months. */
export async function getMonthlySales(): Promise<
  { month: string; revenue: number; orders: number }[]
> {
  const start = new Date()
  start.setMonth(start.getMonth() - 11, 1)
  start.setHours(0, 0, 0, 0)

  const rows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${orders.placedAt}), 'YYYY-MM')`,
      revenue: sum(orders.total),
      orders: count(),
    })
    .from(orders)
    .where(gte(orders.placedAt, start))
    .groupBy(sql`date_trunc('month', ${orders.placedAt})`)

  const byMonth = new Map(
    rows.map((row) => [
      row.month,
      { revenue: num(row.revenue), orders: num(row.orders) },
    ]),
  )

  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(start)
    date.setMonth(start.getMonth() + index)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const found = byMonth.get(key)
    return {
      month: key,
      revenue: found?.revenue ?? 0,
      orders: found?.orders ?? 0,
    }
  })
}

/** Units sold and revenue per category, best first. */
export async function getSalesByCategory(): Promise<
  { slug: string; name: Localized; units: number; revenue: number }[]
> {
  const rows = await db
    .select({
      slug: products.category,
      name: categories.name,
      units: sum(orderItems.quantity),
      revenue: sql<string>`sum(${orderItems.quantity} * ${orderItems.unitPrice})`,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .innerJoin(categories, eq(products.category, categories.slug))
    .groupBy(products.category, categories.name)

  return rows
    .map((row) => ({
      slug: row.slug,
      name: row.name,
      units: num(row.units),
      revenue: num(row.revenue),
    }))
    .sort((a, b) => b.revenue - a.revenue)
}

/** Best-selling products by revenue. */
export async function getTopProducts(limit = 5): Promise<
  { id: string; name: Localized; image: string; units: number; revenue: number }[]
> {
  const rows = await db
    .select({
      id: orderItems.productId,
      name: orderItems.nameSnapshot,
      image: orderItems.imageSnapshot,
      units: sum(orderItems.quantity),
      revenue: sql<string>`sum(${orderItems.quantity} * ${orderItems.unitPrice})`,
    })
    .from(orderItems)
    .groupBy(orderItems.productId, orderItems.nameSnapshot, orderItems.imageSnapshot)
    .orderBy(desc(sql`sum(${orderItems.quantity} * ${orderItems.unitPrice})`))
    .limit(limit)

  return rows.map((row) => ({
    id: row.id ?? '',
    name: row.name,
    image: row.image,
    units: num(row.units),
    revenue: num(row.revenue),
  }))
}

export type RecentOrder = {
  id: string
  orderNumber: string
  customer: string
  phone: string
  items: number
  paymentMethod: PaymentMethod
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  placedAt: string
}

export async function getRecentOrders(limit = 10): Promise<RecentOrder[]> {
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customer: orders.name,
      phone: orders.phone,
      items: orders.itemCount,
      paymentMethod: orders.paymentMethod,
      status: orders.status,
      total: orders.total,
      placedAt: orders.placedAt,
    })
    .from(orders)
    .orderBy(desc(orders.placedAt))
    .limit(limit)

  return rows.map((row) => ({
    ...row,
    total: num(row.total),
    placedAt: row.placedAt.toISOString(),
  }))
}
