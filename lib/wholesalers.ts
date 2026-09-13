import 'server-only'
import { cache } from 'react'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import {
  users,
  wholesalerApplications,
  wholesalerTradeLines,
  type UserRow,
  type WholesaleRole,
  type WholesalerApplicationRow,
} from '@/lib/db/schema'
import type { CategorySlug } from '@/lib/types'

/**
 * Which side of the wholesale programme the viewer joined, or null if they
 * have not picked one (or are signed out).
 *
 * Free: `getCurrentUser` is request-scoped and already selects the whole user
 * row, so nothing here costs a round trip the page was not already paying.
 */
export async function getViewerWholesaleRole(): Promise<WholesaleRole | null> {
  const user = await getCurrentUser()
  return user?.wholesaleRole ?? null
}

/**
 * Guards every path that spends money on trade stock — the mirror of
 * `requireApprovedWholesaler` on the selling side.
 *
 * The two sides are exclusive by rule, and this is where that rule is actually
 * enforced: the seller console simply never renders an "Add to cart", but a
 * seller with a stale cart or a hand-made request would otherwise still get an
 * order through. Throws rather than returning null because the callers are
 * mutations.
 */
export async function requireWholesaleBuyer(): Promise<UserRow> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authorized')
  if (user.wholesaleRole !== 'buyer') {
    throw new Error('Only wholesale buyers can order trade stock')
  }
  return user
}

/**
 * A wholesaler orders nothing at all — house stock included.
 *
 * Wider than `requireWholesaleBuyer` above, and the two are not redundant.
 * That one asks "is this a buyer?" and guards *trade* lines, which is what
 * keeps an ordinary shopper out of the marketplace. This one asks "is this a
 * seller?" and guards *every* line, which is what keeps a wholesaler out of the
 * shop. Between them: shoppers buy house stock, buyers buy both, sellers buy
 * neither.
 *
 * Signed-out visitors and anyone who has not joined pass straight through —
 * only a chosen seller is turned away, and the choice is theirs to make.
 */
export async function assertNotWholesaleSeller(): Promise<void> {
  const user = await getCurrentUser()
  if (user?.wholesaleRole === 'seller') {
    throw new Error('Wholesalers list stock rather than order it')
  }
}

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
 * One shop's trade lines, as the pair the review screen draws: what was asked
 * for, and what was granted. `approved` is always a subset of `requested` in
 * practice — an admin grants from the list — but they are returned separately
 * rather than as a flag per row, because every caller wants one or the other
 * whole.
 *
 * `approved` falls back to the application's own `category_slug` when the join
 * table is empty. That is the shop approved before the table existed, and
 * without the fallback it would lose its line the moment this shipped.
 */
export async function getApplicationLines(
  application: Pick<WholesalerApplicationRow, 'id' | 'categorySlug'>,
): Promise<{ requested: CategorySlug[]; approved: CategorySlug[] }> {
  const rows = await db
    .select({
      categorySlug: wholesalerTradeLines.categorySlug,
      status: wholesalerTradeLines.status,
    })
    .from(wholesalerTradeLines)
    .where(eq(wholesalerTradeLines.applicationId, application.id))
    .orderBy(asc(wholesalerTradeLines.categorySlug))

  const approved = rows
    .filter((row) => row.status === 'approved')
    .map((row) => row.categorySlug)

  return {
    requested: rows.map((row) => row.categorySlug),
    approved:
      approved.length > 0
        ? approved
        : application.categorySlug
          ? [application.categorySlug]
          : [],
  }
}

/**
 * Guards the seller server actions — the mirror of `requireAdmin()`. Throws
 * rather than returning null because the callers are mutations, and a silent
 * null there would be a hole rather than a redirect.
 *
 * `lines` comes back with the shop because every caller that has one needs the
 * other: there is no seller mutation that may skip the "is this inside a line
 * you were approved for" question, and fetching it separately is how one
 * eventually would.
 */
export async function requireApprovedWholesaler(): Promise<{
  user: UserRow
  shop: WholesalerApplicationRow
  lines: CategorySlug[]
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

  const { approved } = await getApplicationLines(shop)
  return { user, shop, lines: approved }
}
