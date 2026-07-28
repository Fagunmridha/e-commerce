/**
 * Derived display state for a scheduled banner. Pure and framework-free so the
 * table, the form preview and any future dashboard tile all agree on what
 * "Live" means — the storefront's own rule lives in `isLive` (lib/banners.ts)
 * and this mirrors it.
 */
export type BannerStatus = 'off' | 'scheduled' | 'live' | 'expired'

export const BANNER_STATUS_LABEL: Record<BannerStatus, string> = {
  off: 'Off',
  scheduled: 'Scheduled',
  live: 'Live',
  expired: 'Expired',
}

export const BANNER_STATUS_CLASS: Record<BannerStatus, string> = {
  off: 'bg-muted text-muted-foreground',
  scheduled: 'bg-sky-500/12 text-sky-700 dark:text-sky-400',
  live: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400',
  expired: 'bg-rose-500/12 text-rose-700 dark:text-rose-400',
}

export function bannerStatus(
  banner: { active: boolean; startsAt: Date | null; endsAt: Date | null },
  now: Date = new Date(),
): BannerStatus {
  if (!banner.active) return 'off'
  if (banner.endsAt && banner.endsAt <= now) return 'expired'
  if (banner.startsAt && banner.startsAt > now) return 'scheduled'
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
