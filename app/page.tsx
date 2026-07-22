import { Hero } from '@/components/hero'
import { Ticker } from '@/components/ticker'
import { FeatureBar } from '@/components/feature-bar'
import { CategoryGrid } from '@/components/category-grid'
import { PopularProducts } from '@/components/popular-products'
import { PromoBanners } from '@/components/promo-banners'
import { DealCountdown } from '@/components/deal-countdown'
import { Testimonials } from '@/components/testimonials'
import { Newsletter } from '@/components/newsletter'

export default function Home() {
  return (
    <>
      <Hero />
      <Ticker />
      <CategoryGrid />
      <PopularProducts />
      <PromoBanners />
      <DealCountdown />
      <FeatureBar />
      <Testimonials />
      <Newsletter />
    </>
  )
}
