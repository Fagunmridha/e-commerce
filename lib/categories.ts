import 'server-only'
import { asc, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  catalogues,
  categories,
  products,
  wholesalerApplications,
} from '@/lib/db/schema'
import type { Category, CategorySlug } from '@/lib/types'

export type AdminCategory = Category & {
  /**
   * Every product filed here — house stock, marketplace listings and
   * pre-orders alike. This is the number the RESTRICT foreign key actually
   * enforces on, unlike `itemCount`, which counts only what the storefront
   * tile promises and so reads 0 for a trade-only row.
   */
  productCount: number
  /** Blocks deletion too: the parent foreign key is RESTRICT as well. */
  childCount: number
  /** Deleted along with the category — that foreign key cascades. */
  catalogueCount: number
  /** Dropped to null on delete — that foreign key sets null. */
  sellerCount: number
}

/**
 * Every category with the four counts the admin screen needs to say what a
 * delete would actually do.
 *
 * Correlated subselects rather than three joins: joining all of them fans the
 * rows out and multiplies every count by the size of the other two.
 *
 * Uncached, for the same reason `getAdminCatalogues` is — someone managing
 * categories must never be shown a stale count of what they are about to
 * delete. Ordered so the tree reads the way it is shaped: each line, then its
 * children under it.
 */
export async function getAdminCategories(): Promise<AdminCategory[]> {
  const rows = await db
    .select({
      slug: categories.slug,
      name: categories.name,
      image: categories.image,
      scope: categories.scope,
      parentSlug: categories.parentSlug,
      productCount: sql<string>`(
        select count(*) from ${products}
        where ${products.category} = ${categories.slug}
      )`,
      childCount: sql<string>`(
        select count(*) from ${categories} child
        where child.parent_slug = ${categories.slug}
      )`,
      catalogueCount: sql<string>`(
        select count(*) from ${catalogues}
        where ${catalogues.categorySlug} = ${categories.slug}
      )`,
      sellerCount: sql<string>`(
        select count(*) from ${wholesalerApplications}
        where ${wholesalerApplications.categorySlug} = ${categories.slug}
      )`,
      /** House shelf stock only — what the storefront tile shows. */
      itemCount: sql<string>`(
        select count(*) from ${products}
        where ${products.category} = ${categories.slug}
          and ${products.sellerId} is null
          and ${products.preorder} = false
      )`,
    })
    .from(categories)
    .orderBy(
      asc(sql`coalesce(${categories.parentSlug}, ${categories.slug})`),
      asc(sql`${categories.parentSlug} nulls first`),
      asc(categories.slug),
    )

  return rows.map((row) => ({
    slug: row.slug as CategorySlug,
    name: row.name,
    image: row.image,
    scope: row.scope,
    parentSlug: row.parentSlug ?? null,
    href: `/${row.slug}`,
    itemCount: Number(row.itemCount),
    productCount: Number(row.productCount),
    childCount: Number(row.childCount),
    catalogueCount: Number(row.catalogueCount),
    sellerCount: Number(row.sellerCount),
  }))
}
