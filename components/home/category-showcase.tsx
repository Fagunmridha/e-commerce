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
      className="group block h-full overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-card-hover focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-secondary">
        <Image
          src={category.image}
          alt=""
          fill
          sizes="(max-width: 640px) 70vw, (max-width: 1024px) 45vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="p-4">
        <h3 className="text-sm font-bold text-foreground transition-colors group-hover:text-primary">
          {label}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {category.itemCount} {t.sections.items}
        </p>
      </div>
    </Link>
  )
}

export function CategoryShowcase() {
  const { t } = useLanguage()
  const { categories } = useCatalogue()
  const rail = useCardRail()

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
                className="basis-[70%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
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

        <RailDots rail={rail} label={title} className="mt-6" />
      </SectionPanel>
    </Reveal>
  )
}
