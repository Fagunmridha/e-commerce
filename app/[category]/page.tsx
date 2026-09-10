import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CategoryPage } from '@/components/category-page'
import { categoryMetadata } from '@/lib/metadata'
import { getRetailCategories } from '@/lib/products'

/**
 * Every storefront category, at the root of the site: /men, /cosmetics.
 *
 * A root-level dynamic segment sounds alarming and is not. Next matches a
 * static segment before a dynamic one at the same depth, so /shop, /about,
 * /wholesale, /sign-in and the rest keep their own pages; this only ever
 * catches a single segment nothing else claims. It is not a catch-all either
 * — /product/17 and /wholesale/apply are two segments and never reach here.
 *
 * Its corollary is `RESERVED_CATEGORY_SLUGS` in lib/reserved-slugs.ts: a
 * category named "shop" would be shadowed by app/shop forever, so the admin
 * form refuses the name rather than saving a page nobody can reach.
 *
 * It replaced four identical folders — app/men, app/women, app/kids,
 * app/accessories — each of which was this file with the slug written in.
 */
export async function generateStaticParams() {
  const categories = await getRetailCategories()
  return categories.map((category) => ({ category: category.slug }))
}

/** A category added since the last build renders on demand rather than 404ing. */
export const dynamicParams = true

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  return categoryMetadata(category)
}

export default async function Page({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params

  // Checked here as well as inside CategoryPage, which reads the same list out
  // of the provider and would 404 too — but only after shipping a full page of
  // HTML with the wrong <title> already in its head.
  const categories = await getRetailCategories()
  if (!categories.some((item) => item.slug === category)) notFound()

  return <CategoryPage slug={category} />
}
