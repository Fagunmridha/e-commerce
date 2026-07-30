import 'server-only'
import { unstable_cache } from 'next/cache'
import { and, desc, eq, isNull, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { coupons, type CouponRow } from '@/lib/db/schema'
import {
  computeDiscount,
  formatCouponHeadline,
  type CouponIssue,
  type FeaturedCoupon,
  type PublicCoupon,
} from '@/lib/coupon-math'

export function normaliseCode(code: string): string {
  return code.trim().toUpperCase()
}

/** Strips the fields a shopper has no business seeing (usage counts, dates). */
function toPublic(row: CouponRow): PublicCoupon {
  return {
    code: row.code,
    type: row.type,
    value: row.value,
    minOrder: row.minOrder,
    maxDiscount: row.maxDiscount,
    description: row.description,
  }
}

export type CouponCheck =
  | { ok: true; coupon: PublicCoupon; discount: number }
  | { ok: false; reason: CouponIssue }

/**
 * Everything that makes a coupon usable *except* the minimum-order test, which
 * needs a cart. `checkCoupon` and the homepage card both run through this, so
 * a code advertised on the hero can never come back "expired" at checkout.
 *
 * Returns the blocking reason rather than a boolean, so `checkCoupon` can pass
 * it straight to the shopper.
 */
export function couponBlocker(
  row: CouponRow,
  now: Date,
): CouponIssue | null {
  if (!row.active) return 'inactive'
  if (row.startsAt && row.startsAt > now) return 'not_started'
  if (row.endsAt && row.endsAt <= now) return 'expired'
  if (row.usageLimit !== null && row.usageCount >= row.usageLimit) {
    return 'used_up'
  }
  return null
}

/**
 * The authoritative validity check. Called both by the checkout preview action
 * and by `createOrder`; the latter never trusts the former's result.
 *
 * Order of checks matters for the message the shopper sees — "spend ৳200 more"
 * is more useful than "expired" when both are true, so the hard blockers are
 * evaluated first and the fixable one last.
 */
export async function checkCoupon(
  code: string,
  subtotal: number,
  now: Date = new Date(),
): Promise<CouponCheck> {
  const normalised = normaliseCode(code)
  if (!normalised) return { ok: false, reason: 'not_found' }

  const [row] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, normalised))

  if (!row) return { ok: false, reason: 'not_found' }

  const blocker = couponBlocker(row, now)
  if (blocker) return { ok: false, reason: blocker }

  // Last, and only here: it is the one problem the shopper can fix by adding
  // to their cart, so it should not mask a hard blocker.
  if (subtotal < row.minOrder) return { ok: false, reason: 'min_order' }

  const coupon = toPublic(row)
  return { ok: true, coupon, discount: computeDiscount(coupon, subtotal) }
}

/**
 * Reserves one redemption. The conditional UPDATE is the whole point: reading
 * `usageCount` and writing it back would let two shoppers both take the last
 * one. Returns the coupon id, or null when it was exhausted in between.
 *
 * Neon's HTTP driver has no interactive transactions, but a single statement
 * is atomic, which is all this needs.
 */
export async function redeemCoupon(code: string): Promise<string | null> {
  const normalised = normaliseCode(code)
  if (!normalised) return null

  const [row] = await db
    .update(coupons)
    .set({ usageCount: sql`${coupons.usageCount} + 1` })
    .where(
      and(
        eq(coupons.code, normalised),
        eq(coupons.active, true),
        or(
          isNull(coupons.usageLimit),
          sql`${coupons.usageCount} < ${coupons.usageLimit}`,
        ),
      ),
    )
    .returning({ id: coupons.id })

  return row?.id ?? null
}

// Cached with the `active` + `featured` filter in SQL only. The date window and
// usage cap are applied against a fresh `now` below — a cached row carries the
// timestamp of whenever it was computed, so putting the schedule in the query
// would leave an expired code advertised on the homepage.
const cachedFeatured = unstable_cache(
  () =>
    db
      .select()
      .from(coupons)
      .where(and(eq(coupons.featured, true), eq(coupons.active, true)))
      .orderBy(desc(coupons.createdAt)),
  ['featured-coupons'],
  { tags: ['coupons'], revalidate: 60 },
)

/**
 * The coupon to advertise on the homepage, or null to fall back to the static
 * marketing copy. Several coupons may be flagged; the newest live one wins.
 *
 * `minOrder` is deliberately *not* used to filter — the homepage has no cart to
 * test it against. It is returned so the card can say "on orders over ৳500".
 */
export async function getFeaturedCoupon(): Promise<FeaturedCoupon | null> {
  const rows = await cachedFeatured()
  const now = new Date()
  const row = rows.find((candidate) => couponBlocker(candidate, now) === null)
  if (!row) return null

  return {
    code: row.code,
    headline: formatCouponHeadline(row.type, row.value),
    description: row.description,
    minOrder: row.minOrder,
  }
}

/** Admin list — every coupon, newest first. */
export async function getAllCoupons(): Promise<CouponRow[]> {
  return db.select().from(coupons).orderBy(sql`${coupons.createdAt} desc`)
}

export async function getCouponById(id: string): Promise<CouponRow | undefined> {
  const [row] = await db.select().from(coupons).where(eq(coupons.id, id))
  return row
}
