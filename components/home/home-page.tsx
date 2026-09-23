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
import type { WholesaleRole } from '@/lib/db/schema'

const ROW = 8

/**
 * The homepage composition. Every row is derived from the live catalogue in the
 * catalogue context, so the sections reflect the real database rather than
 * hardcoded lists.
 */
export function HomePage({
  featuredCoupon,
  reviews,
  wholesaleStatus,
  wholesaleRole,
}: {
  featuredCoupon: FeaturedCoupon | null
  /** Approved customer reviews for the testimonial rail. */
  reviews: HomeReview[]
  /** The viewer's own wholesale application, if any — drives the hero's offer card. */
  wholesaleStatus: 'pending' | 'approved' | 'rejected' | 'suspended' | null
  /** Which side of the wholesale market the viewer already picked, if any. */
  wholesaleRole: WholesaleRole | null
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
      // Best-reviewed stock, highest rating first.
      top: orFallback(
        [...products]
          .filter((product) => product.rating >= 4)
          .sort((a, b) => b.rating - a.rating),
      ),
      // Most-reviewed stock stands in for "trending" — a distinct signal from
      // `top`'s average rating, without needing a live view/sales counter.
      trending: orFallback(
        [...products].sort((a, b) => b.reviews - a.reviews),
      ),
      // The catalogue has no createdAt, so `new` badges stand in for recency.
      newArrivals: orFallback(
        products.filter((product) => product.badge === 'new'),
      ),
      // Hand-curated by the admin — hidden rather than backfilled when empty,
      // since a "Combo Package" row showing non-combo stock would mislead.
      combo: products.filter((product) => product.isCombo),
    }
  }, [products])

  return (
    <>
      <Hero
        coupon={featuredCoupon}
        wholesaleStatus={wholesaleStatus}
        wholesaleRole={wholesaleRole}
      />
      <FeatureBar />

      <CategoryShowcase />

      <ProductSection title={t.home.topTitle} products={rows.top} priority />

      <ProductSection title={t.home.popularTitle} products={rows.trending} />

      <ProductSection title={t.home.newTitle} products={rows.newArrivals} />

      <ProductSection title={t.home.comboTitle} products={rows.combo} />

      <ComingSoon />

      <OfferStrip />

      <WhyChooseUs />

      <Testimonials reviews={reviews} />

      <Newsletter />
    </>
  )
}
