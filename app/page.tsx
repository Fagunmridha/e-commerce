import { HomePage } from '@/components/home/home-page'
import { getFeaturedCoupon } from '@/lib/coupons'

export default async function Home() {
  // Fetched here rather than in a provider: it is homepage-only, and a provider
  // would add this query to every route including /admin and /checkout.
  const featuredCoupon = await getFeaturedCoupon()

  return <HomePage featuredCoupon={featuredCoupon} />
}
