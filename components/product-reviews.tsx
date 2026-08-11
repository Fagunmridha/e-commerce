'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Star } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { Rating } from '@/components/rating'
import { useLanguage } from '@/components/language-provider'
import { submitReview } from '@/app/actions/reviews'
import { cn } from '@/lib/utils'
import type { Review, ReviewStatus } from '@/lib/types'

export function ProductReviews({
  productId,
  reviews,
  viewerReview,
  rating: averageRating,
  reviewCount,
}: {
  productId: string
  /** Approved only — what the public sees. */
  reviews: Review[]
  /** The viewer's own review while it is still unapproved. */
  viewerReview?: Review & { status: ReviewStatus }
  /**
   * The server-side aggregate. Computed over approved rows in one GROUP BY, so
   * it is the same number the product cards and /shop show. This used to be
   * reduced from `reviews` on the client, which was fine until `viewerReview`
   * existed — a pending review would then have skewed the header for its author
   * alone.
   */
  rating: number
  reviewCount: number
}) {
  const { t, locale } = useLanguage()
  const { isSignedIn } = useUser()
  const router = useRouter()
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const copy = t.product.reviews
  // One review per product per person, mirrored from the server guard. An
  // already-approved review of their own also counts, which is why this looks
  // at both lists.
  const [alreadyReviewed, setAlreadyReviewed] = useState(Boolean(viewerReview))

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (body.trim().length < 3) return
    setSubmitting(true)

    const result = await submitReview({ productId, rating, body })
    setSubmitting(false)

    if (result.ok) {
      setBody('')
      setRating(5)
      setAlreadyReviewed(true)
      toast.success(copy.submitted)
      // Brings back the pending card from the server, so the shopper can see
      // exactly what they wrote rather than having to take the toast on faith.
      router.refresh()
      return
    }

    // Each failure gets its own message: "you already reviewed this" is
    // actionable, a single generic error is not.
    if (result.error === 'duplicate') {
      setAlreadyReviewed(true)
      toast.error(copy.alreadyReviewed)
    } else if (result.error === 'not-found') {
      toast.error(copy.notFound)
    } else {
      toast.error(result.message ?? copy.error)
    }
  }

  return (
    // `id` is the target of the rating link in the buy box. `scroll-mt` keeps
    // the heading clear of the sticky site header when jumped to.
    <section
      id="reviews"
      className="mx-auto max-w-page scroll-mt-24 px-4 py-12 sm:px-6 lg:px-4"
    >
      <div className="border-t border-border pt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">{copy.title}</h2>
          {reviewCount > 0 && (
            <Rating value={averageRating} reviews={reviewCount} size="md" />
          )}
        </div>

        {/* The viewer's own review, still waiting on a moderator. Nobody else
            sees this — without it, submitting makes the review vanish, which
            is indistinguishable from a failure. */}
        {viewerReview && (
          <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/40 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-amber-500/12 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                {copy.pendingBadge}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(viewerReview.createdAt)}
              </span>
            </div>
            <Rating value={viewerReview.rating} size="sm" className="mt-2" />
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {viewerReview.body}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              {copy.pendingNote}
            </p>
          </div>
        )}

        {/* Write a review */}
        {!alreadyReviewed && (
          <div className="mt-6 rounded-lg border border-border bg-card p-5">
            {isSignedIn ? (
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">
                    {copy.yourRating}
                  </p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        aria-label={`${value}`}
                      >
                        <Star
                          className={cn(
                            'size-6 transition-colors',
                            value <= rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-muted-foreground/30',
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <Textarea
                  rows={3}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder={copy.placeholder}
                  maxLength={2000}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="submit"
                    disabled={submitting || body.trim().length < 3}
                  >
                    {/* A spinner in the button rather than the page-wide
                        overlay the checkout flows use: posting a review does
                        not navigate anywhere, so blocking the page for it
                        would be out of proportion. */}
                    {submitting && <Spinner className="size-4" />}
                    {submitting ? copy.submitting : copy.submit}
                  </Button>
                  {/* Says so before they write, which is where the expectation
                      belongs — not in a toast after the fact. */}
                  <p className="text-xs text-muted-foreground">
                    {copy.moderationNote}
                  </p>
                </div>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">
                <Link href="/sign-in" className="text-primary hover:underline">
                  {copy.signIn}
                </Link>{' '}
                {copy.signInSuffix}
              </p>
            )}
          </div>
        )}

        {/* Review list */}
        {reviews.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">{copy.empty}</p>
        ) : (
          <ul className="mt-6 space-y-5">
            {reviews.map((review) => (
              <li
                key={review.id}
                className="border-b border-border pb-5 last:border-0"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">
                    {review.authorName}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                <Rating value={review.rating} size="sm" className="mt-1" />
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {review.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
