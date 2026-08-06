'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { products, reviews } from '@/lib/db/schema'
import { getCurrentUser, requireAdmin } from '@/lib/auth'
import {
  bulkReviewStatusSchema,
  featureReviewSchema,
  reviewModerationSchema,
  submitReviewSchema,
  type BulkReviewStatusInput,
  type FeatureReviewInput,
  type ReviewModerationInput,
  type SubmitReviewInput,
} from '@/lib/validation/reviews'
import { uuidSchema } from '@/lib/validation/admin'
import { parseOrThrow } from '@/lib/validation/shared'
import type { ReviewStatus } from '@/lib/types'

/**
 * Everything a review decision has to invalidate.
 *
 * `updateTag('catalogue')` is the load-bearing line: star ratings live *inside*
 * the catalogue cache entries, because `getAllProducts`,
 * `getWholesaleProducts` and `getPreorderProducts` each embed
 * `reviewAggregates()`, and `getHomeReviews` shares the tag. Without it /shop,
 * the category pages and the home rails keep showing the pre-decision average
 * for up to sixty seconds.
 *
 * The product ids come from `RETURNING` on the write itself — see the actions
 * below — so this costs no extra round trip, and the `Set` stops a bulk
 * approval of thirty reviews of one product revalidating it thirty times.
 */
function refresh(productIds: string[]): void {
  updateTag('catalogue')
  for (const id of new Set(productIds)) revalidatePath(`/product/${id}`)
  revalidatePath('/admin/reviews')
  // The testimonial rail.
  revalidatePath('/')
}

/* -------------------------------------------------------------------------- */
/* Customer                                                                    */
/* -------------------------------------------------------------------------- */

export type SubmitReviewResult =
  | { ok: true }
  | { ok: false; error: string; message?: string }

/**
 * Files a review for moderation. It is not public until an admin approves it.
 *
 * Returns a result object rather than throwing, unlike the admin actions below:
 * `components/product-reviews.tsx` branches on `ok` to tell a signed-out
 * shopper to sign in, a duplicate reviewer that they already wrote one, and so
 * on — outcomes that are ordinary rather than exceptional.
 */
export async function submitReview(
  input: SubmitReviewInput,
): Promise<SubmitReviewResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'not-signed-in' }

  let data
  try {
    data = parseOrThrow(submitReviewSchema, input)
  } catch (error) {
    // Surface the real message — "Keep your review under 2000 characters" is
    // actionable in a way that a generic failure is not.
    return {
      ok: false,
      error: 'invalid',
      message: error instanceof Error ? error.message : undefined,
    }
  }

  // Both guards in one batch: over Neon's HTTP driver each statement is its own
  // ~340ms request, and neither guard depends on the other's answer.
  const [[product], [existing]] = await db.batch([
    db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, data.productId)),
    db
      .select({ id: reviews.id })
      .from(reviews)
      .where(
        and(eq(reviews.productId, data.productId), eq(reviews.userId, user.id)),
      ),
  ])

  // Without this a hand-rolled request for a non-existent product used to hit
  // the foreign key and 500.
  if (!product) return { ok: false, error: 'not-found' }
  // Not a general rate limit, but it is the abuse that matters here: one person
  // repeatedly moving one product's star average. Enforced in code rather than
  // by a UNIQUE constraint, which could not be added without first proving the
  // existing rows hold no duplicates.
  if (existing) return { ok: false, error: 'duplicate' }

  await db.insert(reviews).values({
    productId: data.productId,
    userId: user.id,
    authorName: user.name || user.email.split('@')[0] || 'Customer',
    rating: data.rating,
    body: data.body,
    // `status` is deliberately absent: the column default is 'pending', and
    // moderation starting by default is the point of the feature.
  })

  // Only the product page, and only so the author can see their own pending
  // row. Deliberately *no* `updateTag('catalogue')`: a pending review changes
  // nothing public, and busting the whole catalogue cache here would hand every
  // signed-in user a way to drop it at will. The tag belongs on the admin
  // decisions below, where a public average genuinely moves.
  revalidatePath(`/product/${data.productId}`)
  return { ok: true }
}

/* -------------------------------------------------------------------------- */
/* Admin                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * A verdict is a status write plus who made it and when — the row itself is
 * never edited or deleted, so a mistaken rejection is one click from being
 * visible again. Factored out so the bulk variant cannot drift from the single.
 */
function decisionValues(
  status: ReviewStatus,
  note: string | null,
  adminId: number,
) {
  return {
    status,
    reviewNote: note,
    reviewedByUserId: adminId,
    reviewedAt: new Date(),
  }
}

export async function setReviewStatus(
  input: ReviewModerationInput,
): Promise<void> {
  const me = await requireAdmin()
  const data = parseOrThrow(reviewModerationSchema, input)

  const rows = await db
    .update(reviews)
    .set(decisionValues(data.status, data.note, me.id))
    .where(eq(reviews.id, data.id))
    // The action is handed a review id but the page to revalidate is
    // /product/{productId}. RETURNING hands it back in the same statement,
    // which beats both trusting the client and paying for a preceding SELECT.
    .returning({ productId: reviews.productId })

  if (rows.length === 0) throw new Error('That review no longer exists')
  refresh(rows.map((row) => row.productId))
}

export async function setReviewsStatus(
  input: BulkReviewStatusInput,
): Promise<void> {
  const me = await requireAdmin()
  // Parsed, unlike the wholesalers equivalent this is modelled on — an
  // unvalidated array of strings going straight into `inArray` is exactly what
  // the "every payload is parsed" rule exists to stop.
  const data = parseOrThrow(bulkReviewStatusSchema, input)

  const rows = await db
    .update(reviews)
    .set(decisionValues(data.status, null, me.id))
    .where(inArray(reviews.id, data.ids))
    .returning({ productId: reviews.productId })

  refresh(rows.map((row) => row.productId))
}

export async function setReviewFeatured(
  input: FeatureReviewInput,
): Promise<void> {
  await requireAdmin()
  const data = parseOrThrow(featureReviewSchema, input)

  const rows = await db
    .update(reviews)
    .set({ featured: data.featured })
    // Scoped to approved rows. The switch is disabled client-side too, but a
    // stale tab is a real scenario, and featuring an unapproved review would
    // produce a row the homepage predicate can never match — a UI that lies.
    .where(and(eq(reviews.id, data.id), eq(reviews.status, 'approved')))
    .returning({ productId: reviews.productId })

  if (rows.length === 0) {
    throw new Error('Approve the review before featuring it')
  }
  refresh(rows.map((row) => row.productId))
}

export async function deleteReview(id: string): Promise<void> {
  await requireAdmin()
  const reviewId = parseOrThrow(uuidSchema, id)

  const rows = await db
    .delete(reviews)
    .where(eq(reviews.id, reviewId))
    .returning({ productId: reviews.productId })

  if (rows.length === 0) throw new Error('That review no longer exists')
  refresh(rows.map((row) => row.productId))
}
