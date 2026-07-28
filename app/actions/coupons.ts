'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { coupons } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/auth'
import { checkCoupon, type CouponCheck } from '@/lib/coupons'
import { couponSchema, type CouponInput } from '@/lib/validation/coupons'
import { parseOrThrow } from '@/lib/validation/shared'

export type { CouponInput }

/**
 * Cart-preview only — tells the shopper what a code is worth before they
 * commit. The result is never trusted for pricing: `createOrder` re-runs
 * `checkCoupon` server-side and recomputes the discount from its own lookup.
 *
 * Note this endpoint is enumerable by design (anyone can try codes). That is
 * acceptable for a launch discount; if codes ever become valuable, put a
 * per-IP rate limit in front of it.
 */
export async function previewCoupon(
  code: string,
  subtotal: number,
): Promise<CouponCheck> {
  if (typeof code !== 'string' || code.length > 40) {
    return { ok: false, reason: 'not_found' }
  }

  const amount = Number(subtotal)
  const safeSubtotal = Number.isFinite(amount) && amount > 0 ? amount : 0

  return checkCoupon(code, safeSubtotal)
}

function refresh() {
  updateTag('coupons')
  revalidatePath('/admin/coupons')
  // The homepage hero card advertises a featured coupon, so it goes stale too.
  revalidatePath('/')
}

export async function upsertCoupon(input: CouponInput): Promise<void> {
  await requireAdmin()
  const data = parseOrThrow(couponSchema, input)

  const values = {
    code: data.code,
    description: data.description,
    type: data.type,
    value: data.value,
    minOrder: data.minOrder,
    maxDiscount: data.maxDiscount,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    usageLimit: data.usageLimit,
    active: data.active,
    featured: data.featured,
    updatedAt: new Date(),
  }

  if (data.id) {
    // `usageCount` is deliberately absent — editing a coupon must not reset
    // how many times it has already been redeemed.
    await db.update(coupons).set(values).where(eq(coupons.id, data.id))
  } else {
    await db.insert(coupons).values(values)
  }

  refresh()
}

export async function deleteCoupon(id: string): Promise<void> {
  await requireAdmin()
  // `orders.couponId` is ON DELETE SET NULL and `orders.couponCode` keeps the
  // snapshot, so past orders still show which code was used.
  await db.delete(coupons).where(eq(coupons.id, id))
  refresh()
}

export async function setCouponActive(
  id: string,
  active: boolean,
): Promise<void> {
  await requireAdmin()
  await db
    .update(coupons)
    .set({ active, updatedAt: new Date() })
    .where(eq(coupons.id, id))
  refresh()
}

export async function setCouponsActive(
  ids: string[],
  active: boolean,
): Promise<void> {
  await requireAdmin()
  if (ids.length === 0) return
  await db
    .update(coupons)
    .set({ active, updatedAt: new Date() })
    .where(inArray(coupons.id, ids))
  refresh()
}
