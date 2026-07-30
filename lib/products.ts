import 'server-only'
import { unstable_cache } from 'next/cache'
import { and, asc, desc, eq, ilike, isNull, ne, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getViewerShop } from '@/lib/wholesalers'
import {
  categories,
  productImages,
  products,
  reviews,
  wholesalerApplications,
  type ProductRow,
} from '@/lib/db/schema'
import type { Category, CategorySlug, Product } from '@/lib/types'

type Aggregate = { avg: number; count: number }

/** productId → { average rating, review count } for the whole catalogue. */
async function reviewAggregates(): Promise<Map<string, Aggregate>> {
  const rows = await db
    .select({
      productId: reviews.productId,
      avg: sql<string>`avg(${reviews.rating})`,
      count: sql<string>`count(*)`,
    })
    .from(reviews)
    .groupBy(reviews.productId)

  const map = new Map<string, Aggregate>()
  for (const row of rows) {
    map.set(row.productId, {
      avg: Math.round(Number(row.avg) * 10) / 10,
      count: Number(row.count),
    })
  }
  return map
}

function toProduct(
  row: ProductRow,
  agg?: Aggregate,
  sellerName?: string,
): Product {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    oldPrice: row.oldPrice ?? undefined,
    image: row.image,
    category: row.category,
    badge: row.badge ?? undefined,
    sizes: row.sizes ?? undefined,
    colors: row.colors ?? undefined,
    description: row.description ?? undefined,
    stock: row.stock,
    // 1 is "no minimum", which every house product has — left undefined so the
    // UI can test for the badge with a plain truthiness check.
    moq: row.moq > 1 ? row.moq : undefined,
    rating: agg?.avg ?? 0,
    reviews: agg?.count ?? 0,
    sellerId: row.sellerId ?? undefined,
    sellerName,
  }
}

/**
 * The store's own catalogue. Marketplace listings are excluded so /shop, the
 * category pages and the homepage rails keep showing only what the store
 * itself sells — sellers' stock lives in the wholesale section.
 */
async function fetchAllProducts(): Promise<Product[]> {
  const [rows, aggregates] = await Promise.all([
    db
      .select()
      .from(products)
      .where(isNull(products.sellerId))
      .orderBy(asc(products.createdAt), asc(products.id)),
    reviewAggregates(),
  ])
  return rows.map((row) => toProduct(row, aggregates.get(row.id)))
}

// The whole catalogue is fetched on every page (root layout). Cache it so a
// navigation no longer pays a round-trip to the database — admin edits bust
// the `catalogue` tag (see app/actions/admin.ts), so the store stays live.
export const getAllProducts = unstable_cache(fetchAllProducts, ['all-products'], {
  tags: ['catalogue'],
  revalidate: 60,
})

/** Everything listed by approved wholesalers, newest first, with the shop name. */
async function fetchWholesaleProducts(): Promise<Product[]> {
  const [rows, aggregates] = await Promise.all([
    db
      .select({ product: products, shopName: wholesalerApplications.shopName })
      .from(products)
      .innerJoin(
        wholesalerApplications,
        eq(products.sellerId, wholesalerApplications.id),
      )
      .where(eq(wholesalerApplications.status, 'approved'))
      .orderBy(desc(products.createdAt), asc(products.id)),
    reviewAggregates(),
  ])

  return rows.map((row) =>
    toProduct(row.product, aggregates.get(row.product.id), row.shopName),
  )
}

export const getWholesaleProducts = unstable_cache(
  fetchWholesaleProducts,
  ['wholesale-products'],
  { tags: ['catalogue'], revalidate: 60 },
)

/**
 * Everything the store holds, house stock and marketplace listings alike.
 * Only the admin product screens use this — the storefront deliberately keeps
 * the two apart, but an admin managing stock needs to see the lot. Uncached:
 * the admin should never be looking at a stale table.
 */
export async function getAdminProducts(): Promise<Product[]> {
  const [rows, aggregates] = await Promise.all([
    db
      .select({ product: products, shopName: wholesalerApplications.shopName })
      .from(products)
      .leftJoin(
        wholesalerApplications,
        eq(products.sellerId, wholesalerApplications.id),
      )
      .orderBy(asc(products.createdAt), asc(products.id)),
    reviewAggregates(),
  ])

  return rows.map((row) =>
    toProduct(
      row.product,
      aggregates.get(row.product.id),
      row.shopName ?? undefined,
    ),
  )
}

/** One product's rating, for the paths that fetch a single row. */
async function reviewAggregate(id: string): Promise<Aggregate | undefined> {
  const [agg] = await db
    .select({
      avg: sql<string>`avg(${reviews.rating})`,
      count: sql<string>`count(*)`,
    })
    .from(reviews)
    .where(eq(reviews.productId, id))

  return agg && Number(agg.count) > 0
    ? { avg: Math.round(Number(agg.avg) * 10) / 10, count: Number(agg.count) }
    : undefined
}

/**
 * Finds house *and* marketplace products — the detail page serves both. The
 * marketplace half is gated: a listing is only returned when its shop is still
 * approved *and* the viewer is an approved wholesaler themselves. Without that
 * second half `/product/w-something` would be a way around the hidden market,
 * and a suspended shop's stock would stay buyable through a stale link.
 *
 * The viewer is resolved here rather than passed in so a new caller cannot
 * forget the check. Admin screens use `getAdminProductById` instead.
 */
export async function getProductById(id: string): Promise<Product | undefined> {
  const [row] = await db.select().from(products).where(eq(products.id, id))
  if (!row) return undefined

  if (!row.sellerId) {
    return toProduct(row, await reviewAggregate(id))
  }

  const [shop] = await db
    .select({
      shopName: wholesalerApplications.shopName,
      status: wholesalerApplications.status,
    })
    .from(wholesalerApplications)
    .where(eq(wholesalerApplications.id, row.sellerId))

  if (shop?.status !== 'approved') return undefined
  if (!(await getViewerShop())) return undefined

  return toProduct(row, await reviewAggregate(id), shop.shopName)
}

/** Admin edit screen — no seller or approval gate, by design. */
export async function getAdminProductById(
  id: string,
): Promise<Product | undefined> {
  const [row] = await db.select().from(products).where(eq(products.id, id))
  if (!row) return undefined

  const [shop] = row.sellerId
    ? await db
        .select({ shopName: wholesalerApplications.shopName })
        .from(wholesalerApplications)
        .where(eq(wholesalerApplications.id, row.sellerId))
    : []

  return toProduct(row, await reviewAggregate(id), shop?.shopName)
}

/**
 * One of a shop's own listings, for its edit screen. Scoped by `sellerId` so
 * another shop's id resolves to undefined rather than loading their product
 * into a form the seller cannot actually save.
 */
export async function getSellerProductById(
  shopId: string,
  id: string,
): Promise<Product | undefined> {
  const [row] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.sellerId, shopId)))

  return row ? toProduct(row, await reviewAggregate(id)) : undefined
}

/** A single shop's listings, live or hidden — powers the seller dashboard. */
export async function getSellerProducts(shopId: string): Promise<Product[]> {
  const [rows, aggregates] = await Promise.all([
    db
      .select()
      .from(products)
      .where(eq(products.sellerId, shopId))
      .orderBy(desc(products.createdAt), asc(products.id)),
    reviewAggregates(),
  ])
  return rows.map((row) => toProduct(row, aggregates.get(row.id)))
}

/** Category pages show the store's own stock only. */
export async function getProductsByCategory(
  slug: CategorySlug,
): Promise<Product[]> {
  const [rows, aggregates] = await Promise.all([
    db
      .select()
      .from(products)
      .where(and(eq(products.category, slug), isNull(products.sellerId))),
    reviewAggregates(),
  ])
  return rows.map((row) => toProduct(row, aggregates.get(row.id)))
}

/** Homepage "Popular Products" — anything carrying a badge. */
export async function getPopularProducts(limit = 8): Promise<Product[]> {
  const all = await getAllProducts()
  return all.filter((product) => product.badge).slice(0, limit)
}

/** Cart drawer / product page suggestions — anything but the item being viewed. */
export async function getRecommendedProducts(
  excludeId?: string,
  limit = 2,
): Promise<Product[]> {
  const all = await getAllProducts()
  return all.filter((product) => product.id !== excludeId).slice(0, limit)
}

/** Detail-page gallery: pads out with category siblings when a product has one shot. */
export async function getProductImages(product: Product): Promise<string[]> {
  const extra = await db
    .select({ url: productImages.url })
    .from(productImages)
    .where(eq(productImages.productId, product.id))
    .orderBy(asc(productImages.position))

  if (extra.length) return [product.image, ...extra.map((row) => row.url)]

  const siblings = await db
    .select({ image: products.image })
    .from(products)
    .where(
      and(
        eq(products.category, product.category),
        ne(products.id, product.id),
        isNull(products.sellerId),
      ),
    )
    .limit(3)

  return [product.image, ...siblings.map((row) => row.image)]
}

/** Free-text search over English and Bangla product names. */
export async function searchProducts(query: string): Promise<Product[]> {
  const term = `%${query.trim()}%`
  const [rows, aggregates] = await Promise.all([
    db
      .select()
      .from(products)
      .where(
        and(
          isNull(products.sellerId),
          or(
            sql`${products.name}->>'en' ILIKE ${term}`,
            sql`${products.name}->>'bn' ILIKE ${term}`,
          ),
        ),
      ),
    reviewAggregates(),
  ])
  return rows.map((row) => toProduct(row, aggregates.get(row.id)))
}

async function fetchAllCategories(): Promise<Category[]> {
  const rows = await db.select().from(categories)
  const counts = await db
    .select({
      category: products.category,
      count: sql<string>`count(*)`,
    })
    .from(products)
    .where(isNull(products.sellerId))
    .groupBy(products.category)

  const countMap = new Map(counts.map((row) => [row.category, Number(row.count)]))

  // The four seeded categories keep their editorial order; anything the admin
  // adds later sorts alphabetically after them. `indexOf` returns -1 for an
  // unknown slug, so it has to be mapped past the end of the known list rather
  // than used directly — otherwise new categories would sort to the front.
  const order: CategorySlug[] = ['men', 'women', 'kids', 'accessories']
  const rank = (slug: CategorySlug) => {
    const index = order.indexOf(slug)
    return index === -1 ? order.length : index
  }

  return rows
    .map((row) => ({
      slug: row.slug as CategorySlug,
      name: row.name,
      href: `/${row.slug}`,
      image: row.image,
      itemCount: countMap.get(row.slug as CategorySlug) ?? 0,
    }))
    .sort((a, b) => rank(a.slug) - rank(b.slug) || a.slug.localeCompare(b.slug))
}

export const getAllCategories = unstable_cache(
  fetchAllCategories,
  ['all-categories'],
  { tags: ['catalogue'], revalidate: 60 },
)

export async function getCategory(
  slug: CategorySlug,
): Promise<Category | undefined> {
  const all = await getAllCategories()
  return all.find((category) => category.slug === slug)
}
