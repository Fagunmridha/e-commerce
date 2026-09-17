import { HomePage } from '@/components/home/home-page'
import { getFeaturedCoupon } from '@/lib/coupons'
import { getHomeReviews } from '@/lib/reviews'
import { getCurrentUser } from '@/lib/auth'
import { getApplicationForUser } from '@/lib/wholesalers'

export default async function Home() {
  // Fetched here rather than in a provider: both are homepage-only, and a
  // provider would add these queries to every route including /admin and
  // /checkout. Both are cached, so on a warm cache this costs nothing.
  const [featuredCoupon, reviews, user] = await Promise.all([
    getFeaturedCoupon(),
    getHomeReviews(),
    // `getCurrentUser` is request-cached, so this is free for a signed-in
    // visitor — the layout has already paid for it.
    getCurrentUser(),
  ])
  const application = user ? await getApplicationForUser(user.id) : null

  return (
    <HomePage
      featuredCoupon={featuredCoupon}
      reviews={reviews}
      wholesaleStatus={application?.status ?? null}
      wholesaleRole={user?.wholesaleRole ?? null}
    />
  )
}
