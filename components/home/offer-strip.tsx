'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { Reveal } from '@/components/reveal'
import { useLanguage } from '@/components/language-provider'
import { useCatalogue } from '@/components/catalogue-provider'
import type { CategorySlug } from '@/lib/types'

/** Which category each promo tile points at and borrows its artwork from. */
const TILES = [
  { key: 'summer', slug: 'men', href: '/men', fallback: '/cat_mens_wear.png' },
  {
    key: 'arrivals',
    slug: 'women',
    href: '/women',
    fallback: '/cat_womens_wear.png',
  },
  {
    key: 'accessories',
    slug: 'accessories',
    href: '/accessories',
    fallback: '/placeholder.svg',
  },
] as const satisfies readonly {
  key: string
  slug: CategorySlug
  href: string
  fallback: string
}[]

/** Three flat offer tiles: eyebrow, lead line, headline and a Shop Now button. */
export function OfferStrip() {
  const { t } = useLanguage()
  const { getCategory } = useCatalogue()
  const copy = t.home.offers

  const content = {
    summer: {
      eyebrow: copy.summerEyebrow,
      lead: copy.summerLead,
      headline: copy.summerHeadline,
    },
    arrivals: {
      eyebrow: copy.arrivalsEyebrow,
      lead: copy.arrivalsLead,
      headline: copy.arrivalsHeadline,
    },
    accessories: {
      eyebrow: copy.accessoriesEyebrow,
      lead: copy.accessoriesLead,
      headline: copy.accessoriesHeadline,
    },
  }

  return (
    <section className="py-3 lg:py-4">
      <Container>
        <div className="grid gap-4 md:grid-cols-3 md:gap-5">
          {TILES.map((tile, index) => {
            const text = content[tile.key]
            const image = getCategory(tile.slug)?.image ?? tile.fallback

            return (
              <Reveal key={tile.key} delay={index * 90}>
                <Link
                  href={tile.href}
                  className="group relative flex h-full min-h-40 items-center overflow-hidden rounded-2xl bg-secondary sm:min-h-44 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <div className="relative z-10 w-[62%] p-4 sm:w-3/5 sm:p-6">
                    <p className="text-[13px] font-semibold text-primary sm:text-sm">
                      {text.eyebrow}
                    </p>
                    <p className="mt-2 text-[13px] font-semibold text-foreground sm:text-sm">
                      {text.lead}
                    </p>
                    <p className="mt-0.5 text-xl leading-tight font-extrabold tracking-tight text-balance text-foreground sm:text-2xl">
                      {text.headline}
                    </p>

                    <span className="mt-4 inline-flex h-9 items-center rounded-md bg-button px-4 text-xs font-semibold text-button-foreground transition-colors group-hover:bg-button/90">
                      {copy.cta}
                    </span>
                  </div>

                  {/* Artwork sits on the right and fades into the tile. */}
                  <div className="absolute inset-y-0 right-0 w-1/2">
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 50vw, 20vw"
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      style={{
                        maskImage:
                          'linear-gradient(to right, transparent, black 35%)',
                        WebkitMaskImage:
                          'linear-gradient(to right, transparent, black 35%)',
                      }}
                    />
                  </div>
                </Link>
              </Reveal>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
