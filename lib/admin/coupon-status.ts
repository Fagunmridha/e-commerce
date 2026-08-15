/**
 * Derived display state for a coupon. Mirrors the order of checks in
 * `checkCoupon` (lib/coupons.ts) so the badge never claims "Live" for a code
 * the storefront would reject.
 */
export type CouponStatus = 'off' | 'scheduled' | 'live' | 'expired' | 'used_up'

export const COUPON_STATUS_LABEL: Record<CouponStatus, string> = {
  off: 'Off',
  scheduled: 'Scheduled',
  live: 'Live',
  expired: 'Expired',
  used_up: 'Used up',
}

export const COUPON_STATUS_CLASS: Record<CouponStatus, string> = {
  off: 'bg-muted text-muted-foreground',
  scheduled: 'bg-sky-500/12 text-sky-700',
  live: 'bg-emerald-500/12 text-emerald-700',
  expired: 'bg-rose-500/12 text-rose-700',
  used_up: 'bg-amber-500/12 text-amber-700',
}

export function couponStatus(
  coupon: {
    active: boolean
    startsAt: Date | null
    endsAt: Date | null
    usageLimit: number | null
    usageCount: number
  },
  now: Date = new Date(),
): CouponStatus {
  if (!coupon.active) return 'off'
  if (coupon.endsAt && coupon.endsAt <= now) return 'expired'
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    return 'used_up'
  }
  if (coupon.startsAt && coupon.startsAt > now) return 'scheduled'
  return 'live'
}

const DAY = { day: 'numeric', month: 'short' } as const

/** "1 Mar – 20 Mar", "From 1 Mar", "Until 20 Mar" or "Always on". */
export function formatWindow(
  startsAt: Date | null,
  endsAt: Date | null,
): string {
  const start = startsAt?.toLocaleDateString('en-GB', DAY)
  const end = endsAt?.toLocaleDateString('en-GB', DAY)

  if (start && end) return `${start} – ${end}`
  if (start) return `From ${start}`
  if (end) return `Until ${end}`
  return 'Always on'
}
