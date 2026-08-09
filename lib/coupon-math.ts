import {
  formatPrice,
  getShippingCost,
  type DeliveryZone,
} from '@/lib/currency'
import type { Localized } from '@/lib/i18n'

/**
 * Coupon arithmetic, shared by the cart preview (client) and `createOrder`
 * (server) — the same split `lib/currency.ts` already uses for shipping.
 * Deliberately has no `server-only` import and touches no database.
 *
 * The server is still the authority: only the *code* crosses the wire, never
 * the discount, and `createOrder` recomputes everything from its own lookup.
 * This module exists so the two sides cannot disagree on the maths.
 */

/** The subset of a coupon a shopper is allowed to see. */
export type PublicCoupon = {
  code: string
  type: 'percent' | 'fixed'
  value: number
  minOrder: number
  maxDiscount: number | null
  description: Localized | null
}

export type CouponIssue =
  | 'not_found'
  | 'inactive'
  | 'not_started'
  | 'expired'
  | 'min_order'
  | 'used_up'

/**
 * What the homepage hero card advertises. Lives here rather than in
 * `lib/coupons.ts` so the client hero component can import the type without
 * reaching into a `server-only` module.
 */
export type FeaturedCoupon = {
  code: string
  /** "20% OFF" / "৳500 OFF", ready to render. */
  headline: string
  description: Localized | null
  /** 0 when the coupon has no minimum. */
  minOrder: number
}

/** Rounds to whole taka so client and server totals cannot drift by an epsilon. */
function money(value: number): number {
  return Math.round(value)
}

/**
 * Discount in taka for a given subtotal — clamped to the subtotal so a coupon
 * can never make an order negative, and to `maxDiscount` for percent codes.
 */
export function computeDiscount(
  coupon: PublicCoupon,
  subtotal: number,
): number {
  if (subtotal <= 0 || subtotal < coupon.minOrder) return 0

  const raw =
    coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value

  const capped =
    coupon.maxDiscount !== null ? Math.min(raw, coupon.maxDiscount) : raw

  return money(Math.max(0, Math.min(capped, subtotal)))
}

/**
 * The order totals. Delivery is a flat per-zone charge that a discount cannot
 * move, so the only thing the coupon touches here is the goods.
 */
export function computeTotals(
  subtotal: number,
  coupon: PublicCoupon | null,
  zone: DeliveryZone,
): { subtotal: number; discount: number; shipping: number; total: number } {
  const discount = coupon ? computeDiscount(coupon, subtotal) : 0
  const shipping = getShippingCost(subtotal, zone)

  return {
    subtotal: money(subtotal),
    discount,
    shipping,
    total: money(subtotal - discount + shipping),
  }
}

/** "20% off" / "৳500 off" — used on the applied-coupon chip. */
export function formatCouponValue(coupon: PublicCoupon): string {
  return coupon.type === 'percent'
    ? `${coupon.value}%`
    : formatPrice(coupon.value)
}

/**
 * "20% OFF" / "৳500 OFF" — the headline on the homepage hero card, where the
 * coupon has to read as an offer rather than a line item.
 */
export function formatCouponHeadline(
  type: PublicCoupon['type'],
  value: number,
): string {
  if (type === 'percent') return `${value}% OFF`
  return `${formatPrice(value)} OFF`
}
