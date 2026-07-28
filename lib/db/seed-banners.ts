import { db } from './index'
import { banners } from './schema'
import { DICTIONARIES } from '@/lib/dictionaries'

/**
 * Backfills the hero slides that used to be hardcoded in the dictionary, so
 * turning the hero DB-driven does not change what a visitor sees. Only the
 * first slide was ever reachable before (the component read `slides[0]`) —
 * after this the other three rotate as they were always meant to.
 *
 * Idempotent: upserts on `slug`. Re-running restores the stock copy, which is
 * also the way back if an admin's edits go wrong.
 */

/** Slide index → the artwork and destination it was written for. */
const SLIDE_META = [
  { slug: 'hero-new-collection', image: '/hero_clothing_rack.png', href: '/shop' },
  { slug: 'hero-mens-collection', image: '/cat_mens_wear.png', href: '/men' },
  { slug: 'hero-womens-collection', image: '/cat_womens_wear.png', href: '/women' },
  { slug: 'hero-kids-collection', image: '/hero_clothing_rack.png', href: '/kids' },
]

export async function seedBanners(): Promise<number> {
  const en = DICTIONARIES.en.hero.slides
  const bn = DICTIONARIES.bn.hero.slides

  // The two dictionaries are written in lockstep; clamp anyway so a future
  // edit to one of them cannot produce a row with a missing translation.
  const count = Math.min(en.length, bn.length, SLIDE_META.length)

  for (let index = 0; index < count; index += 1) {
    const meta = SLIDE_META[index]
    const values = {
      slug: meta.slug,
      placement: 'hero' as const,
      image: meta.image,
      label: { en: en[index].label, bn: bn[index].label },
      title: { en: en[index].title, bn: bn[index].title },
      highlight: { en: en[index].highlight, bn: bn[index].highlight },
      subtitle: { en: en[index].subtitle, bn: bn[index].subtitle },
      ctaLabel: { en: en[index].cta, bn: bn[index].cta },
      ctaHref: meta.href,
      startsAt: null,
      endsAt: null,
      active: true,
      sortOrder: index,
      updatedAt: new Date(),
    }

    await db
      .insert(banners)
      .values(values)
      .onConflictDoUpdate({ target: banners.slug, set: values })
  }

  return count
}
