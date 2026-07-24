import 'server-only'
import { unstable_cache } from 'next/cache'
import { and, asc, eq, ilike, ne, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  categories,
  productImages,
  products,
  reviews,
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

function toProduct(row: ProductRow, agg?: Aggregate): Product {
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
    rating: agg?.avg ?? 0,
    reviews: agg?.count ?? 0,
  }
}

async function fetchAllProducts(): Promise<Product[]> {
  const [rows, aggregates] = await Promise.all([
    db.select().from(products).orderBy(asc(products.createdAt), asc(products.id)),
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

export async function getProductById(id: string): Promise<Product | undefined> {
  const [row] = await db.select().from(products).where(eq(products.id, id))
  if (!row) return undefined

  const [agg] = await db
    .select({
      avg: sql<string>`avg(${reviews.rating})`,
      count: sql<string>`count(*)`,
    })
    .from(reviews)
    .where(eq(reviews.productId, id))

  const aggregate: Aggregate | undefined =
    agg && Number(agg.count) > 0
      ? { avg: Math.round(Number(agg.avg) * 10) / 10, count: Number(agg.count) }
      : undefined

  return toProduct(row, aggregate)
}

export async function getProductsByCategory(
  slug: CategorySlug,
): Promise<Product[]> {
  const [rows, aggregates] = await Promise.all([
    db.select().from(products).where(eq(products.category, slug)),
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
    .where(and(eq(products.category, product.category), ne(products.id, product.id)))
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
        or(
          sql`${products.name}->>'en' ILIKE ${term}`,
          sql`${products.name}->>'bn' ILIKE ${term}`,
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
    .groupBy(products.category)

  const countMap = new Map(counts.map((row) => [row.category, Number(row.count)]))

  const order: CategorySlug[] = ['men', 'women', 'kids', 'accessories']

  return rows
    .map((row) => ({
      slug: row.slug as CategorySlug,
      name: row.name,
      href: `/${row.slug}`,
      image: row.image,
      itemCount: countMap.get(row.slug as CategorySlug) ?? 0,
    }))
    .sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug))
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
