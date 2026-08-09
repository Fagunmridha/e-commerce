'use client'

import { Rating } from '@/components/rating'
import { useLanguage } from '@/components/language-provider'
import type { Review } from '@/lib/types'

/**
 * Social proof, read-only.
 *
 * Deliberately not `ProductReviews`: that component carries the write form,
 * which needs a signed-in account. Ad traffic is signed out by definition, so
 * on this page the form would only ever render its "sign in to review" state —
 * a dead end inside the funnel. Reviews are shown; writing one happens on the
 * product page.
 */
export function LandingReviews({
  reviews,
  rating,
  reviewCount,
}: {
  reviews: Review[]
  rating: number
  reviewCount: number
}) {
  const { t, locale } = useLanguage()

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

  return (
    <section className="border-t border-border py-12 lg:py-16">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-4">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {t.landing.reviewsTitle}
          </h2>
          {reviewCount > 0 && (
            <Rating value={rating} reviews={reviewCount} size="md" />
          )}
        </div>

        {reviews.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t.landing.noReviews}
          </p>
        ) : (
          <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {reviews.slice(0, 6).map((review) => (
              <li
                key={review.id}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <Rating value={review.rating} />
                <p className="mt-3 text-sm leading-relaxed text-foreground">
                  {review.body}
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                  {review.authorName} • {formatDate(review.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
