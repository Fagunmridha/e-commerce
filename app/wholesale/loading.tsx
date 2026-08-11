import { PageSkeleton } from '@/components/page-skeleton'

/**
 * Covers the pitch page and the apply form. Both are `force-dynamic` and both
 * open with a database round trip, so without this the gap between the header
 * and the footer is empty — worst on /wholesale/apply, which then redirects an
 * approved shop to its dashboard and pays for a second load.
 *
 * The seller console below (/wholesale/dashboard, /wholesale/market) overrides
 * this with its own shape.
 */
export default function Loading() {
  return <PageSkeleton />
}
