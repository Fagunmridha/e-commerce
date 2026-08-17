import 'server-only'
import { cache } from 'react'
import { and, count, desc, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import {
  users,
  wholesalerApplications,
  type UserRow,
  type WholesalerApplicationRow,
} from '@/lib/db/schema'

/** Admin list — every application, newest first, with the applicant's login. */
export async function getAllApplications(): Promise<
  (WholesalerApplicationRow & { userEmail: string })[]
> {
  const rows = await db
    .select({
      application: wholesalerApplications,
      userEmail: users.email,
    })
    .from(wholesalerApplications)
    .innerJoin(users, eq(wholesalerApplications.userId, users.id))
    .orderBy(desc(wholesalerApplications.createdAt))

  return rows.map((row) => ({ ...row.application, userEmail: row.userEmail }))
}

export async function getApplicationById(
  id: string,
): Promise<WholesalerApplicationRow | undefined> {
  const [application] = await db
    .select()
    .from(wholesalerApplications)
    .where(eq(wholesalerApplications.id, id))

  return application
}

/** The signed-in applicant's own row — drives the `/wholesale/apply` page. */
export async function getApplicationForUser(
  userId: number,
): Promise<WholesalerApplicationRow | undefined> {
  const [application] = await db
    .select()
    .from(wholesalerApplications)
    .where(eq(wholesalerApplications.userId, userId))

  return application
}

/**
 * The viewer's *approved* shop, or null. This is the one check that decides
 * whether someone sees the marketplace at all, so it is deliberately narrow:
 * pending, rejected and suspended all come back null.
 *
 * Called from the root layout on every request, and again from the product
 * page's marketplace gate — hence request-scoped, so those share one lookup
 * instead of two round trips.
 */
export const getViewerShop = cache(async function getViewerShop(): Promise<WholesalerApplicationRow | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const [shop] = await db
    .select()
    .from(wholesalerApplications)
    .where(
      and(
        eq(wholesalerApplications.userId, user.id),
        eq(wholesalerApplications.status, 'approved'),
      ),
    )

  return shop ?? null
})

/**
 * The viewer's shop for the purpose of *being paid* — approved or suspended.
 *
 * Wider than `getViewerShop` on purpose, and deliberately a separate function
 * rather than a flag on that one. Suspending a shop takes it off the market and
 * out of the seller console, but it does not cancel money the store already
 * owes it for goods it delivered: a paused seller who cannot see their own
 * settlement sheets has no way to check what they are owed, which turns a
 * temporary pause into a dispute.
 *
 * Nothing writeable hangs off this. Every seller mutation still goes through
 * `requireApprovedWholesaler`, and the market gate is still `getViewerShop`, so
 * widening the payout view cannot widen anything else.
 */
export const getViewerPayoutShop = cache(
  async function getViewerPayoutShop(): Promise<WholesalerApplicationRow | null> {
    const user = await getCurrentUser()
    if (!user) return null

    const [shop] = await db
      .select()
      .from(wholesalerApplications)
      .where(
        and(
          eq(wholesalerApplications.userId, user.id),
          inArray(wholesalerApplications.status, ['approved', 'suspended']),
        ),
      )

    return shop ?? null
  },
)

/**
 * Guards the seller server actions — the mirror of `requireAdmin()`. Throws
 * rather than returning null because the callers are mutations, and a silent
 * null there would be a hole rather than a redirect.
 */
export async function requireApprovedWholesaler(): Promise<{
  user: UserRow
  shop: WholesalerApplicationRow
}> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authorized')

  const [shop] = await db
    .select()
    .from(wholesalerApplications)
    .where(
      and(
        eq(wholesalerApplications.userId, user.id),
        eq(wholesalerApplications.status, 'approved'),
      ),
    )

  if (!shop) throw new Error('Not authorized')
  return { user, shop }
}

/** Feeds the admin header bell, next to the pending-order count. */
export async function getPendingApplicationCount(): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(wholesalerApplications)
    .where(eq(wholesalerApplications.status, 'pending'))

  return row?.n ?? 0
}
