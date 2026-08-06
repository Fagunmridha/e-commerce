import Link from 'next/link'
import { ReviewsTable } from '@/components/admin/reviews/reviews-table'
import { getAdminReviews, getReviewStatusCounts } from '@/lib/reviews'
import { REVIEW_STATUSES, type ReviewStatus } from '@/lib/admin/review-status'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const active = REVIEW_STATUSES.find((value) => value === status) as
    | ReviewStatus
    | undefined

  const [reviews, counts] = await Promise.all([
    getAdminReviews({ status: active }),
    getReviewStatusCounts(),
  ])

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-foreground">Reviews</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Customers write these from a product page. Nothing is published until
          you approve it — approving a review adds its stars to that product’s
          rating, and rejecting one takes them back out.
        </p>
      </div>

      {/* The header bell and the sidebar both deep-link here with a status, so
          the filter runs in SQL rather than only in the table. */}
      <nav className="mb-6 flex flex-wrap gap-1.5">
        {[undefined, ...REVIEW_STATUSES].map((value) => (
          <Link
            key={value ?? 'all'}
            href={value ? `/admin/reviews?status=${value}` : '/admin/reviews'}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors',
              active === value
                ? 'border-transparent bg-button text-button-foreground'
                : 'border-border text-muted-foreground hover:bg-muted',
            )}
          >
            {value ?? 'All'}
            <span className="ml-1.5 opacity-70">{counts[value ?? 'all']}</span>
          </Link>
        ))}
      </nav>

      <ReviewsTable reviews={reviews} />
    </div>
  )
}
