import type { Metadata } from 'next'
import { getCategory } from '@/lib/products'
import type { CategorySlug } from '@/lib/types'
import type { Dictionary } from '@/lib/dictionaries'
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

/** Metadata for /men, /women, /kids and /accessories. */
export async function categoryMetadata(slug: CategorySlug): Promise<Metadata> {
  const locale = await getServerLocale()
  const t = await getServerDictionary()
  const category = await getCategory(slug)

  return {
    title: `${category ? category.name[locale] : slug} ${t.meta.suffix}`,
    description: t.categoryDescriptions[slug],
  }
}
