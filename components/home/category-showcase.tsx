'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Reveal } from '@/components/reveal'
import { SectionPanel } from '@/components/layout/section-panel'
import {
  RailDots,
  RailEdgeArrows,
  RailItem,
  RailTrack,
  useCardRail,
} from '@/components/layout/card-rail'
import { useLanguage } from '@/components/language-provider'
import { useCatalogue } from '@/components/catalogue-provider'
import type { Category } from '@/lib/types'

function CategoryCard({ category }: { category: Category }) {
  const { t, pick } = useLanguage()
  const label = pick(category.name)

  return (
    <Link
      href={category.href}
      className="group block h-full overflow-hidden rounded-xl transition-all duration-300 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none sm:border sm:border-border sm:bg-card sm:hover:-translate-y-1 sm:hover:border-transparent sm:hover:shadow-card-hover"
    >
      {/* A square thumbnail packs four categories into one phone row. */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-secondary sm:aspect-4/3 sm:rounded-none">
        <Image
          src={category.image}
          alt=""
          fill
          sizes="(max-width: 640px) 24vw, (max-width: 1024px) 45vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="pt-2 text-center sm:p-4 sm:text-left">
        <h3 className="text-[11px] leading-tight font-bold text-foreground transition-colors group-hover:text-primary sm:text-sm">
          {label}
        </h3>
        <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
          {category.itemCount} {t.sections.items}
        </p>
      </div>
    </Link>
  )
}

export function CategoryShowcase() {
  const { t } = useLanguage()
  const { categories } = useCatalogue()
  const rail = useCardRail({ gridBelowSm: 4 })

  if (categories.length === 0) return null

  const title = t.sections.topCategories

  return (
    <Reveal>
      <SectionPanel
        title={title}
        linkLabel={t.sections.viewAllCategories}
        linkHref="/shop"
      >
        <div className="relative">
          <RailTrack rail={rail} label={title}>
            {categories.map((category) => (
              <RailItem
                key={category.slug}
                rail={rail}
                className="sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
              >
                <CategoryCard category={category} />
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
    </Reveal>
  )
}
