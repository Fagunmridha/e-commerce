import 'server-only'
import { unstable_cache } from 'next/cache'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { banners, type BannerPlacement, type BannerRow } from '@/lib/db/schema'
import type { Localized } from '@/lib/i18n'

/** What the storefront needs — no scheduling fields, no admin metadata. */
export type HeroSlide = {
  id: string
  image: string
  label: Localized | null
  title: Localized
  highlight: Localized | null
  subtitle: Localized | null
  ctaLabel: Localized | null
  ctaHref: string
}

function toSlide(row: BannerRow): HeroSlide {
  return {
    id: row.id,
    image: row.image,
    label: row.label,
    title: row.title,
    highlight: row.highlight,
    subtitle: row.subtitle,
    ctaLabel: row.ctaLabel,
    ctaHref: row.ctaHref,
  }
}

/** True when `now` falls inside the banner's window. Null bounds are open. */
export function isLive(row: BannerRow, now: Date): boolean {
  if (!row.active) return false
  if (row.startsAt && row.startsAt > now) return false
  if (row.endsAt && row.endsAt <= now) return false
  return true
}

async function fetchActive(placement: BannerPlacement): Promise<BannerRow[]> {
  return db
    .select()
    .from(banners)
    .where(and(eq(banners.placement, placement), eq(banners.active, true)))
    .orderBy(asc(banners.sortOrder), asc(banners.createdAt))
}

// Cached by placement, but *only* the `active` filter lives in SQL. The date
// window is applied below against a fresh `now`, because a cached result
// carries the timestamp of whenever it was computed — putting `startsAt <= now`
// in the query would let an Eid slide appear up to a minute late, or linger
// past its end date. Admin writes bust the `banners` tag either way.
const cachedHeroBanners = unstable_cache(
  () => fetchActive('hero'),
  ['hero-banners'],
  { tags: ['banners'], revalidate: 60 },
)

export async function getHeroSlides(): Promise<HeroSlide[]> {
  const rows = await cachedHeroBanners()
  const now = new Date()
  return rows.filter((row) => isLive(row, now)).map(toSlide)
}

/** Admin list — every banner regardless of state, newest schedule first. */
export async function getAllBanners(): Promise<BannerRow[]> {
  return db
    .select()
    .from(banners)
    .orderBy(asc(banners.placement), asc(banners.sortOrder), asc(banners.createdAt))
}

export async function getBannerById(id: string): Promise<BannerRow | undefined> {
  const [row] = await db.select().from(banners).where(eq(banners.id, id))
  return row
}
