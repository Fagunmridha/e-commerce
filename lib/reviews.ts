import 'server-only'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { reviews } from '@/lib/db/schema'
import type { Review } from '@/lib/types'

export async function getProductReviews(productId: string): Promise<Review[]> {
  const rows = await db
    .select()
    .from(reviews)
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt))

  return rows.map((row) => ({
    id: row.id,
    productId: row.productId,
    authorName: row.authorName,
    rating: row.rating,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  }))
}
