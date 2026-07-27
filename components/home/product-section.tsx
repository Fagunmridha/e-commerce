'use client'

import { Reveal } from '@/components/reveal'
import { SectionPanel } from '@/components/layout/section-panel'
import { ProductCard } from '@/components/product-card'
import {
  RailDots,
  RailEdgeArrows,
  RailItem,
  RailTrack,
  useCardRail,
} from '@/components/layout/card-rail'
import { useLanguage } from '@/components/language-provider'
import type { Product } from '@/lib/types'

/**
 * One reusable carousel panel behind every product row on the homepage — New
 * Products, Popular, Featured, Best Sellers and Flash Sale all render through
 * this so they stay pixel-identical.
 */
export function ProductSection({
  title,
  products,
  viewAllHref = '/shop',
  priority = false,
}: {
  title: string
  products: Product[]
  viewAllHref?: string
  /** Eager-load the first row's images when the section is above the fold. */
  priority?: boolean
}) {
  const rail = useCardRail({ gridBelowSm: 2 })
  const { t } = useLanguage()

  if (products.length === 0) return null

  return (
    <Reveal>
      <SectionPanel
        title={title}
        linkLabel={t.sections.viewAll}
        linkHref={viewAllHref}
      >
        <div className="relative">
          <RailTrack rail={rail} label={title}>
            {products.map((product, index) => (
              <RailItem
                key={product.id}
                rail={rail}
                className="sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
              >
                <ProductCard product={product} priority={priority && index < 4} />
              </RailItem>
            ))}
          </RailTrack>

          <RailEdgeArrows
            rail={rail}
            prevLabel={`${t.common.previous}: ${title}`}
            nextLabel={`${t.common.next}: ${title}`}
          />
        </div>

        {/* No carousel to page through below sm — the cards are all on screen. */}
        <RailDots rail={rail} label={title} className="mt-6 hidden sm:flex" />
      </SectionPanel>
    </Reveal>
  )
}
