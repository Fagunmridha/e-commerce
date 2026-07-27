import type { Metadata } from 'next'
import { getCategory } from '@/lib/products'
import type { CategorySlug } from '@/lib/types'
import { getCategoryDescription, type Dictionary } from '@/lib/dictionaries'
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

/** Metadata for a category page, e.g. /men or /accessories. */
export async function categoryMetadata(slug: CategorySlug): Promise<Metadata> {
  const locale = await getServerLocale()
  const t = await getServerDictionary()
  const category = await getCategory(slug)
  const name = category ? category.name[locale] : slug

  return {
    title: `${name} ${t.meta.suffix}`,
    // Admin-added categories have no translated blurb; fall back to the store
    // description so the page never ships an empty meta description.
    description: getCategoryDescription(t, slug) ?? t.meta.siteDescription,
  }
}
