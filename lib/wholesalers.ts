import 'server-only'
import { and, count, desc, eq } from 'drizzle-orm'
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
 * Called from the root layout on every request, so it is one join rather than
 * `getCurrentUser()` followed by a second lookup.
 */
export async function getViewerShop(): Promise<WholesalerApplicationRow | null> {
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
}

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
