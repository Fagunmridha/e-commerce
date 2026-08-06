import { HomePage } from '@/components/home/home-page'
import { getFeaturedCoupon } from '@/lib/coupons'
import { getHomeReviews } from '@/lib/reviews'

export default async function Home() {
  // Fetched here rather than in a provider: both are homepage-only, and a
  // provider would add these queries to every route including /admin and
  // /checkout. Both are cached, so on a warm cache this costs nothing.
  const [featuredCoupon, reviews] = await Promise.all([
    getFeaturedCoupon(),
    getHomeReviews(),
  ])

  return <HomePage featuredCoupon={featuredCoupon} reviews={reviews} />
}
