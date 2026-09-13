import 'server-only'
import { and, asc, count, eq, isNull, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { db } from '@/lib/db'
import {
  catalogues,
  categories,
  products,
  wholesalerApplications,
} from '@/lib/db/schema'
import type { Category, CategorySlug } from '@/lib/types'

/**
 * `categories` under a second name, so the child count can join the table to
 * itself without the subquery's `parent_slug` resolving to the outer row's.
 */
const child = alias(categories, 'child')

/** A third name for the same table, used to read a row's parent's `position`. */
const line = alias(categories, 'line')

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
      position: categories.position,
      status: categories.status,
      // Each count is a whole query builder embedded in the select, not a
      // hand-written subquery. Interpolating bare columns into `sql` emits
      // them unqualified — `where "category" = "slug"`, which reads "slug" as
      // a column of `products` and fails — whereas a builder writes
      // `"products"."category" = "categories"."slug"` and the correlation
      // survives.
      productCount: sql<string>`(${db
        .select({ n: count() })
        .from(products)
        .where(eq(products.category, categories.slug))})`,
      childCount: sql<string>`(${db
        .select({ n: count() })
        .from(child)
        .where(eq(child.parentSlug, categories.slug))})`,
      catalogueCount: sql<string>`(${db
        .select({ n: count() })
        .from(catalogues)
        .where(eq(catalogues.categorySlug, categories.slug))})`,
      sellerCount: sql<string>`(${db
        .select({ n: count() })
        .from(wholesalerApplications)
        .where(eq(wholesalerApplications.categorySlug, categories.slug))})`,
      /** House shelf stock only — what the storefront tile shows. */
      itemCount: sql<string>`(${db
        .select({ n: count() })
        .from(products)
        .where(
          and(
            eq(products.category, categories.slug),
            isNull(products.sellerId),
            eq(products.preorder, false),
          ),
        )})`,
    })
    .from(categories)
    .orderBy(
      // Lines sort against each other by *their* position, so a child has to
      // borrow its parent's — a row with no parent is already its own line and
      // the coalesce falls through to its own.
      sql`(coalesce((${db
        .select({ p: line.position })
        .from(line)
        .where(eq(line.slug, categories.parentSlug))}), ${categories.position})) asc`,
      // Children sort under their line, and the line itself comes first within
      // that group. `nulls first` belongs after the direction, so this is one
      // fragment rather than `asc()` wrapped around it.
      sql`coalesce(${categories.parentSlug}, ${categories.slug}) asc`,
      sql`${categories.parentSlug} asc nulls first`,
      asc(categories.position),
      asc(categories.slug),
    )

  return rows.map((row) => ({
    slug: row.slug as CategorySlug,
    name: row.name,
    image: row.image,
    scope: row.scope,
    parentSlug: row.parentSlug ?? null,
    position: row.position,
    status: row.status,
    href: `/${row.slug}`,
    itemCount: Number(row.itemCount),
    productCount: Number(row.productCount),
    childCount: Number(row.childCount),
    catalogueCount: Number(row.catalogueCount),
    sellerCount: Number(row.sellerCount),
  }))
}
