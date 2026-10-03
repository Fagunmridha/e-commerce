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
import { sectionProducts, type HomeSection } from '@/lib/home-sections'
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
    const row = (section: HomeSection) =>
      sectionProducts(section, products).slice(0, ROW)
    return {
      top: row('top'),
      trending: row('trending'),
      newArrivals: row('new'),
      combo: row('combo'),
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

      <ProductSection
        title={t.home.topTitle}
        products={rows.top}
        viewAllHref="/shop?section=top"
        priority
      />

      <ProductSection
        title={t.home.popularTitle}
        products={rows.trending}
        viewAllHref="/shop?section=trending"
      />

      <ProductSection
        title={t.home.newTitle}
        products={rows.newArrivals}
        viewAllHref="/shop?section=new"
      />

      <ProductSection
        title={t.home.comboTitle}
        products={rows.combo}
        viewAllHref="/shop?section=combo"
      />

      <ComingSoon
        coupon={featuredCoupon}
        wholesaleStatus={wholesaleStatus}
        wholesaleRole={wholesaleRole}
      />

      <OfferStrip />

      <WhyChooseUs />

      <Testimonials reviews={reviews} />

      <Newsletter />
    </>
  )
}
