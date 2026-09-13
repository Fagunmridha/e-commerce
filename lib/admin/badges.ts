import 'server-only'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  contactMessages,
  orders,
  products,
  reviews,
  wholesalerApplications,
} from '@/lib/db/schema'

/** What the header's bell counts: real work waiting, not a decorative dot. */
export type AdminBadgeCounts = {
  pendingOrders: number
  pendingWholesalers: number
  pendingReviews: number
  pendingListings: number
  newMessages: number
}

const NONE: AdminBadgeCounts = {
  pendingOrders: 0,
  pendingWholesalers: 0,
  pendingReviews: 0,
  pendingListings: 0,
  newMessages: 0,
}

/** `count(*)` comes back as a bigint string over the wire. */
function num(value: unknown): number {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * All four badge counts in a single round trip.
 *
 * Four separate `count(*)` queries are four HTTP requests to a database in
 * us-east-2, and they sit in the admin *layout* — so every page of the console
 * paid for all four before it rendered anything. As scalar subqueries they cost
 * the database no more than they did apart, and the page waits once.
 *
 * Failure is swallowed on purpose. These numbers decorate a bell; a flaky
 * connection should dim the badges, not throw the whole admin shell out with a
 * runtime error and leave an admin unable to reach any page at all.
 */
export async function getAdminBadgeCounts(): Promise<AdminBadgeCounts> {
  try {
    const result = await db.execute<{
      pending_orders: string
      pending_wholesalers: string
      pending_reviews: string
      pending_listings: string
      new_messages: string
    }>(sql`
      select
        (select count(*) from ${orders}
          where ${orders.status} = 'pending') as pending_orders,
        (select count(*) from ${wholesalerApplications}
          where ${wholesalerApplications.status} = 'pending') as pending_wholesalers,
        (select count(*) from ${reviews}
          where ${reviews.status} = 'pending') as pending_reviews,
        (select count(*) from ${products}
          where ${products.approvalStatus} = 'pending') as pending_listings,
        (select count(*) from ${contactMessages}
          where ${contactMessages.status} = 'new') as new_messages
    `)

    const row = result.rows[0]
    if (!row) return NONE

    return {
      pendingOrders: num(row.pending_orders),
      pendingWholesalers: num(row.pending_wholesalers),
      pendingReviews: num(row.pending_reviews),
      pendingListings: num(row.pending_listings),
      newMessages: num(row.new_messages),
    }
  } catch (error) {
    console.error('[admin] badge counts unavailable:', error)
    return NONE
  }
}
