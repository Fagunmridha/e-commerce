import type { Metadata } from 'next'
import { getCategory } from '@/lib/products'
import type { CategorySlug } from '@/lib/types'
import { getCategoryDescription, type Dictionary } from '@/lib/dictionaries'
import { getPolicy, type PolicySlug } from '@/lib/policies'
import { getServerDictionary, getServerLocale } from '@/lib/server-locale'

/** Metadata for a page whose copy already lives under `pages` in the dictionary. */
export async function pageMetadata(
  key: keyof Dictionary['pages'],
): Promise<Metadata> {
  const t = await getServerDictionary()
  const page = t.pages[key]

  return {
    title: `${page.title} ${t.meta.suffix}`,
    description: page.description,
  }
}

/** Metadata for a legal page — its copy lives in `lib/policies.ts`. */
export async function policyMetadata(slug: PolicySlug): Promise<Metadata> {
  const locale = await getServerLocale()
  const t = await getServerDictionary()
  const doc = getPolicy(locale, slug)

  return {
    title: `${doc.title} ${t.meta.suffix}`,
    description: doc.description,
  }
}

/** Metadata for a category page, e.g. /men or /accessories. */
export async function categoryMetadata(slug: CategorySlug): Promise<Metadata> {
  const locale = await getServerLocale()
  const t = await getServerDictionary()
  const category = await getCategory(slug)

  // Now that /:slug catches anything unclaimed, this runs for every mistyped
  // URL on the way to a 404. Echoing the slug back would put "asdf" in the
  // title of a not-found page, so an unknown category gets the store's own.
  if (!category) {
    return {
      title: t.meta.siteTitle,
      description: t.meta.siteDescription,
    }
  }

  const name = category.name[locale]

  return {
    title: `${name} ${t.meta.suffix}`,
    // Admin-added categories have no translated blurb; fall back to the store
    // description so the page never ships an empty meta description.
    description: getCategoryDescription(t, slug) ?? t.meta.siteDescription,
  }
}
