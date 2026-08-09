'use client'

import Link from 'next/link'
import { BadgeCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { Container } from '@/components/layout/container'
import { Rating } from '@/components/rating'
import { Reveal } from '@/components/reveal'
import {
  RailDots,
  RailItem,
  RailTrack,
  useCardRail,
} from '@/components/layout/card-rail'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'
import type { Localized } from '@/lib/i18n'
import type { HomeReview } from '@/lib/types'

const AVATAR_TINTS = [
  'bg-[#e0e7ff] text-[#3730a3]',
  'bg-[#fce7f3] text-[#9d174d]',
  'bg-[#fef3c7] text-[#92400e]',
]

/**
 * What one slide renders, whether it came from the database or the placeholder
 * list. Normalising both sources into this shape keeps the JSX to a single
 * branch — `product` is the only thing a placeholder cannot supply.
 */
type Card = {
  key: string
  name: string
  text: string
  rating: number
  product?: { id: string; name: Localized }
}

/** One customer quote at a time, paged by the arrows either side. */
export function Testimonials({ reviews = [] }: { reviews?: HomeReview[] }) {
  const { t, pick } = useLanguage()
  const rail = useCardRail()
  const title = t.home.reviewsTitle

  const cards: Card[] = reviews.length
    ? reviews.map((review) => ({
        key: review.id,
        name: review.authorName,
        text: review.body,
        rating: review.rating,
        product: { id: review.productId, name: review.productName },
      }))
    : // PLACEHOLDER — invented people, shown only while no review has been
      // approved yet. See the note on `t.home.testimonials` in
      // lib/dictionaries.ts: delete this branch and that block together once
      // real reviews have accumulated. The hardcoded 5 lives here rather than
      // in the markup so it leaves with the people it belongs to.
      t.home.testimonials.map((placeholder, index) => ({
        key: `placeholder-${index}`,
        name: placeholder.name,
        text: placeholder.text,
        rating: 5,
      }))

  // Two 40px arrows plus gaps eat a fifth of a 390px panel, so on phones the
  // rail is dragged and paged by the dots below instead.
  const arrow =
    'hidden size-10 shrink-0 place-items-center rounded-full border border-border bg-background text-foreground sm:grid transition-colors hover:border-button hover:bg-button hover:text-button-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-35'

  return (
    <section className="py-6 lg:py-8">
      <Container>
        <Reveal>
          {/* Flat like every other section — see `SectionPanel`. */}
          <div>
            <h2 className="mb-4 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {title}
            </h2>

            <div className="flex items-center gap-3 sm:gap-5">
              <button
                type="button"
                onClick={rail.scrollPrev}
                disabled={!rail.canPrev}
                aria-label={`${t.common.previous}: ${title}`}
                className={arrow}
              >
                <ChevronLeft className="size-5" />
              </button>

              <div className="min-w-0 flex-1">
                <RailTrack rail={rail} label={title}>
                  {cards.map((card, index) => (
                    <RailItem key={card.key} className="basis-full">
                      {/* The avatar + quote group is centred in the bar, with
                          the text itself left-aligned beside the avatar. */}
                      <figure className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-5 text-center sm:flex-row sm:text-left">
                        <span
                          className={cn(
                            'grid size-20 shrink-0 place-items-center rounded-full text-2xl font-bold',
                            AVATAR_TINTS[index % AVATAR_TINTS.length],
                          )}
                          aria-hidden="true"
                        >
                          {card.name.charAt(0)}
                        </span>

                        <div className="min-w-0">
                          <Rating
                            value={card.rating}
                            size="sm"
                            className="justify-center sm:justify-start"
                          />

                          {/* Real reviews run from ten characters to two
                              thousand; without a clamp the one-slide rail
                              jumps in height between quotes. The full text
                              stays on the product page. */}
                          <blockquote className="mt-2 line-clamp-5 text-sm leading-relaxed text-muted-foreground">
                            &ldquo;{card.text}&rdquo;
                          </blockquote>

                          <figcaption className="mt-2">
                            <span className="block text-sm font-semibold text-foreground">
                              – {card.name}
                            </span>
                            <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                              {t.home.verifiedBuyer}
                              <BadgeCheck
                                className="size-3.5 text-emerald-500"
                                aria-hidden="true"
                              />
                            </span>
                            {card.product && (
                              <Link
                                href={`/product/${card.product.id}`}
                                className="mt-0.5 block text-xs text-muted-foreground transition-colors hover:text-primary"
                              >
                                {t.home.reviewsOnProduct.replace(
                                  '{product}',
                                  pick(card.product.name),
                                )}
                              </Link>
                            )}
                          </figcaption>
                        </div>
                      </figure>
                    </RailItem>
                  ))}
                </RailTrack>
              </div>

              <button
                type="button"
                onClick={rail.scrollNext}
                disabled={!rail.canNext}
                aria-label={`${t.common.next}: ${title}`}
                className={arrow}
              >
                <ChevronRight className="size-5" />
              </button>
            </div>

            <RailDots rail={rail} label={title} className="mt-5" />
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
