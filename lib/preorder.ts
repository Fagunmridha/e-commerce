/**
 * The pre-order advance maths, in one place.
 *
 * Deliberately free of `server-only` — the booking sheet quotes an advance, the
 * checkout summary restates it and `createOrder` decides it for real, and this
 * module exists so those three cannot disagree. Same reasoning as
 * `lib/coupon-math.ts`.
 */

/**
 * Applied when a product has no percentage of its own.
 *
 * Zero: the store takes pre-orders on cash on delivery, exactly like everything
 * else it sells, and no shopper is ever asked to send money before the goods
 * arrive. The machinery below is still here because the decision is per-product
 * — an admin can set a percentage on a single expensive run without a schema
 * change — but nothing asks for an advance until one of them does.
 */
export const DEFAULT_ADVANCE_PCT = 0

/**
 * How much of this product's goods value is payable up front.
 *
 * `undefined` (a null column) means the store default; a stored `0` is a real
 * choice — a pre-order taken on pure cash-on-delivery — and must not be
 * collapsed into the fallback, which is why this is not a plain `||`.
 */
export function advancePct(product: { preorderAdvancePct?: number }): number {
  const value = product.preorderAdvancePct
  if (value === undefined || value === null) return DEFAULT_ADVANCE_PCT
  return Math.min(100, Math.max(0, value))
}

/**
 * Splits an order total into what is paid now and what is collected on
 * delivery.
 *
 * `goodsSubtotal` is the advance base and excludes shipping — delivery is
 * charged in cash with the balance, so quoting an advance on it would have the
 * shopper pre-paying for a courier. The invariant every caller relies on is
 * `advance + due === total`, so `due` is computed by subtraction rather than by
 * a second rounding.
 */
export function splitPayment(
  total: number,
  goodsSubtotal: number,
  pct: number,
): { advance: number; due: number } {
  const advance = Math.min(Math.max(0, Math.round((goodsSubtotal * pct) / 100)), total)
  return { advance, due: total - advance }
}

/**
 * `2026-08-18` → `18 Aug`. Built from the parts rather than `new Date(value)`
 * so the calendar day the admin chose is the day the customer reads — parsing
 * the string as an instant would shift it either side of midnight depending on
 * the reader's timezone.
 *
 * Safe to render during SSR for the same reason: the date is a stored value,
 * not something derived from "today", so server and client agree and there is
 * no hydration mismatch to dodge.
 */
export function formatShipDate(value: string | undefined, locale: string): string {
  if (!value) return '—'
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return value

  return new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}
