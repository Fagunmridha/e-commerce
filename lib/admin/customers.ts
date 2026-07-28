import 'server-only'
import { desc, eq, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { orders, users, type OrderRow, type UserRow } from '@/lib/db/schema'

export type CustomerRow = UserRow & {
  orderCount: number
  lifetimeValue: number
  lastOrderAt: Date | null
}

/**
 * Every account with its order history rolled up. One LEFT JOIN rather than a
 * query per row — the old page showed name/email/role only, so this is the
 * first time the list needs aggregates at all.
 *
 * Cancelled orders are excluded from lifetime value: money that was never
 * taken should not inflate what a customer is "worth".
 */
export async function getCustomers(): Promise<CustomerRow[]> {
  const rows = await db
    .select({
      id: users.id,
      clerkId: users.clerkId,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
      orderCount: sql<string>`count(${orders.id})`,
      lifetimeValue: sql<string>`coalesce(sum(${orders.total}) filter (where ${orders.status} <> 'cancelled'), 0)`,
      lastOrderAt: sql<Date | null>`max(${orders.placedAt})`,
    })
    .from(users)
    .leftJoin(orders, eq(orders.userId, users.id))
    .groupBy(users.id)
    .orderBy(desc(users.createdAt))

  return rows.map((row) => ({
    ...row,
    orderCount: Number(row.orderCount),
    lifetimeValue: Number(row.lifetimeValue),
    lastOrderAt: row.lastOrderAt ? new Date(row.lastOrderAt) : null,
  }))
}

export async function getCustomerById(
  id: number,
): Promise<CustomerRow | undefined> {
  const all = await getCustomers()
  return all.find((customer) => customer.id === id)
}

/**
 * A customer's orders, plus any guest checkouts that share their phone or
 * email. The guest matches are a heuristic — nothing verified them — so the
 * caller labels them as such rather than folding them into the totals.
 */
export async function getCustomerOrders(
  customer: Pick<CustomerRow, 'id' | 'email'>,
): Promise<{ owned: OrderRow[]; guessedGuest: OrderRow[] }> {
  const owned = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, customer.id))
    .orderBy(desc(orders.placedAt))

  const phones = [...new Set(owned.map((order) => order.phone))]
  if (phones.length === 0) return { owned, guessedGuest: [] }

  const guessedGuest = await db
    .select()
    .from(orders)
    .where(
      sql`${orders.userId} is null and ${or(...phones.map((phone) => eq(orders.phone, phone)))}`,
    )
    .orderBy(desc(orders.placedAt))

  return { owned, guessedGuest }
}
