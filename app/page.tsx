import { HomePage } from '@/components/home/home-page'
import { getHeroSlides } from '@/lib/banners'
import { getFeaturedCoupon } from '@/lib/coupons'

export default async function Home() {
  // Fetched here rather than in a provider: both are homepage-only, and a
  // provider would add these queries to every route including /admin and
  // /checkout.
  const [heroSlides, featuredCoupon] = await Promise.all([
    getHeroSlides(),
    getFeaturedCoupon(),
  ])

  return <HomePage heroSlides={heroSlides} featuredCoupon={featuredCoupon} />
}
