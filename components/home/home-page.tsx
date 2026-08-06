'use client'

import { useMemo } from 'react'
import { Hero } from '@/components/home/hero'
import { FeatureBar } from '@/components/feature-bar'
import { CategoryShowcase } from '@/components/home/category-showcase'
import { ProductSection } from '@/components/home/product-section'
import { ComingSoon } from '@/components/home/coming-soon'
import { OfferStrip } from '@/components/home/offer-strip'
import { WhyChooseUs } from '@/components/home/why-choose-us'
import { Testimonials } from '@/components/home/testimonials'
import { Newsletter } from '@/components/newsletter'
import { useLanguage } from '@/components/language-provider'
import { useCatalogue } from '@/components/catalogue-provider'
import type { FeaturedCoupon } from '@/lib/coupon-math'
import type { HomeReview } from '@/lib/types'

const ROW = 8

/**
 * The homepage composition. Every row is derived from the live catalogue in the
 * catalogue context, so the sections reflect the real database rather than
 * hardcoded lists.
 */
export function HomePage({
  featuredCoupon,
  reviews,
}: {
  featuredCoupon: FeaturedCoupon | null
  /** Approved customer reviews for the testimonial rail. */
  reviews: HomeReview[]
}) {
  const { t } = useLanguage()
  const { products } = useCatalogue()

  const rows = useMemo(() => {
    // A young catalogue may have no badges, no discounts and no reviews yet.
    // Falling back to the full list keeps each row populated instead of letting
    // whole sections disappear from the page.
    const orFallback = (list: typeof products) =>
      (list.length > 0 ? list : products).slice(0, ROW)

    return {
      // The catalogue has no createdAt, so `new` badges stand in for recency.
      newArrivals: orFallback(
        products.filter((product) => product.badge === 'new'),
      ),
      featured: orFallback(products.filter((product) => product.rating >= 4)),
    }
  }, [products])

  return (
    <>
      <Hero coupon={featuredCoupon} />
      <FeatureBar />

      <CategoryShowcase />

      <ProductSection
        title={t.home.newTitle}
        products={rows.newArrivals}
        priority
      />

      <ProductSection title={t.home.featuredTitle} products={rows.featured} />

      <ComingSoon />

      <OfferStrip />

      <WhyChooseUs />

      <Testimonials reviews={reviews} />

      <Newsletter />
    </>
  )
}
