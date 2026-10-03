'use client'

import { useState } from 'react'
import { SectionPanel } from '@/components/layout/section-panel'
import { Reveal } from '@/components/reveal'
import {
  RailDots,
  RailEdgeArrows,
  RailItem,
  RailTrack,
  useCardRail,
} from '@/components/layout/card-rail'
import { useLanguage } from '@/components/language-provider'
import { useCatalogue } from '@/components/catalogue-provider'
import { BookingSheet } from '@/components/preorder/booking-sheet'
import { MobileHeroOffers } from './mobile-hero-offers'
import { PreorderCard } from '@/components/preorder/preorder-card'
import type { Product } from '@/lib/types'

/**
 * The pre-order rail. Everything here comes from the database: which products
 * appear, the ship-from date, how many pieces are left of the run and how many
 * are already booked. An admin controls the lot from the product form and
 * /admin/preorders.
 *
 * Booking opens a sheet and goes on to its own checkout. Nothing here touches
 * the cart, which is why the shopper is never asked to empty their basket — a
 * pre-order and shelf stock cannot share an order, and keeping the two flows
 * apart is how that rule stops being the shopper's problem.
 */
export function ComingSoon({
  coupon,
  wholesaleStatus,
  wholesaleRole,
}: any) {
  const { t } = useLanguage()
  const { preorderProducts } = useCatalogue()
  const rail = useCardRail({ gridBelowSm: 2 })

  // The card the sheet was opened from; null while it is closed.
  const [selected, setSelected] = useState<Product | null>(null)

  if (preorderProducts.length === 0) return null

  const title = t.home.comingTitle

  return (
    <Reveal>
      <SectionPanel
        title={title}
        linkLabel={t.sections.viewAll}
        linkHref="/preorder"
      >
        <div className="relative">
          <RailTrack rail={rail} label={title} stagger>
            {preorderProducts.map((product) => (
              <RailItem
                key={product.id}
                rail={rail}
                className="sm:basis-1/2 lg:basis-1/3 xl:basis-1/5"
              >
                <PreorderCard product={product} onBook={setSelected} />
              </RailItem>
            ))}
          </RailTrack>

          <RailEdgeArrows
            rail={rail}
            prevLabel={`${t.common.previous}: ${title}`}
            nextLabel={`${t.common.next}: ${title}`}
          />
        </div>

        <RailDots rail={rail} label={title} className="mt-6 hidden sm:flex" />
      </SectionPanel>

      {/* Mobile-only: show the hero offers (wholesale + coupon) below the Coming Soon rail */}
      <MobileHeroOffers
        coupon={coupon}
        wholesaleStatus={wholesaleStatus}
        wholesaleRole={wholesaleRole}
      />

      <BookingSheet
        product={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      />
    </Reveal>
  )
}
