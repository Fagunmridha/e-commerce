import 'server-only'
import { unstable_cache } from 'next/cache'
import { and, asc, count, desc, eq, gte, isNull, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { products, reviews, users } from '@/lib/db/schema'
import type { HomeReview, ReviewStatus } from '@/lib/types'

/**
 * Review reads that are not part of the product detail batch.
 *
 * The per-product list and rating aggregate live in `lib/products.ts`, inside
 * the single `db.batch` that page already sends. What is here instead is the
 * homepage testimonial feed and the admin moderation queue — two queries whose
 * subject is reviews rather than products.
 */

/** How many quotes the homepage rail holds. It shows one at a time. */
const HOME_LIMIT = 8

/** Reviews at or above this rating carry the homepage on their own. */
const HOME_RATING_FLOOR = 4

/**
 * The homepage testimonial feed.
 *
 * One predicate, no branching: approved **and** (featured **or** 4+ stars).
 * `featured` is the admin's override — it beats the rating floor, which is what
 * lets a genuinely useful three-star review ("lovely shirt, runs one size
 * small") be published as social proof. Ordering by `featured` first pins the
 * curated ones to the front; when nothing is featured that sort degenerates to
 * a no-op and the rail is simply the newest approved 4+ reviews, so there is no
 * empty-featured special case anywhere in the code.
 *
 * `isNull(products.sellerId)` is load-bearing. A review of a marketplace
 * listing would otherwise surface on the public homepage linking to
 * `/product/w-…`, which `loadProductDetail`'s wholesaler gate turns into a 404
 * for every ordinary shopper.
 */
async function fetchHomeReviews(): Promise<HomeReview[]> {
  const rows = await db
    .select({
      id: reviews.id,
      authorName: reviews.authorName,
      rating: reviews.rating,
      body: reviews.body,
      createdAt: reviews.createdAt,
      productId: reviews.productId,
      productName: products.name,
    })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .where(
      and(
        eq(reviews.status, 'approved'),
        isNull(products.sellerId),
        or(eq(reviews.featured, true), gte(reviews.rating, HOME_RATING_FLOOR)),
      ),
    )
    .orderBy(desc(reviews.featured), desc(reviews.createdAt))
    .limit(HOME_LIMIT)

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
  }))
}

/**
 * Shares the `catalogue` tag rather than owning one. Every review decision
 * already has to bust `catalogue` — `getAllProducts`, `getWholesaleProducts`
 * and `getPreorderProducts` each embed `reviewAggregates()`, so approving a
 * review moves star ratings held inside those entries. A second tag would be
 * one more thing every future action has to remember, for no benefit.
 */
export const getHomeReviews = unstable_cache(
  fetchHomeReviews,
  ['home-reviews-v1'],
  { tags: ['catalogue'], revalidate: 60 },
)

/** A row of the admin moderation queue. English-only, like the whole console. */
export type AdminReviewRow = {
  id: string
  productId: string
  productName: string
  authorName: string
  authorEmail: string
  rating: number
  body: string
  status: ReviewStatus
  featured: boolean
  submitted: string
  reviewedAt: string | null
}

/**
 * Uncached: an admin deciding whether to publish a review must never be reading
 * a minute-old queue. Pending rows lead whatever the sort — that is the work.
 */
export async function getAdminReviews(filter?: {
  status?: ReviewStatus
}): Promise<AdminReviewRow[]> {
  const rows = await db
    .select({
      id: reviews.id,
      productId: reviews.productId,
      productName: products.name,
      authorName: reviews.authorName,
      authorEmail: users.email,
      rating: reviews.rating,
      body: reviews.body,
      status: reviews.status,
      featured: reviews.featured,
      createdAt: reviews.createdAt,
      reviewedAt: reviews.reviewedAt,
    })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .innerJoin(users, eq(users.id, reviews.userId))
    .where(filter?.status ? eq(reviews.status, filter.status) : undefined)
    .orderBy(
      asc(sql`case when ${reviews.status} = 'pending' then 0 else 1 end`),
      desc(reviews.createdAt),
    )

  const day = (value: Date | null) =>
    value
      ? value.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : null

  return rows.map((row) => ({
    id: row.id,
    productId: row.productId,
    productName: row.productName.en,
    authorName: row.authorName,
    authorEmail: row.authorEmail,
    rating: row.rating,
    body: row.body,
    status: row.status,
    featured: row.featured,
    submitted: day(row.createdAt) ?? '',
    reviewedAt: day(row.reviewedAt),
  }))
}

/** One GROUP BY for the status pills, instead of three passes over the table. */
export async function getReviewStatusCounts(): Promise<
  Record<ReviewStatus | 'all', number>
> {
  const rows = await db
    .select({ status: reviews.status, n: count() })
    .from(reviews)
    .groupBy(reviews.status)

  const counts = { all: 0, pending: 0, approved: 0, rejected: 0 }
  for (const row of rows) {
    counts[row.status] = row.n
    counts.all += row.n
  }
  return counts
}

/** Drives the admin header bell, beside pending orders and applications. */
export async function getPendingReviewCount(): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(reviews)
    .where(eq(reviews.status, 'pending'))

  return row?.n ?? 0
}
