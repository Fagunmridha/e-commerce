'use client'

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

const AVATAR_TINTS = [
  'bg-[#e0e7ff] text-[#3730a3]',
  'bg-[#fce7f3] text-[#9d174d]',
  'bg-[#fef3c7] text-[#92400e]',
]

/** One customer quote at a time, paged by the arrows either side. */
export function Testimonials() {
  const { t } = useLanguage()
  const rail = useCardRail()
  const title = t.home.reviewsTitle

  // Two 40px arrows plus gaps eat a fifth of a 390px panel, so on phones the
  // rail is dragged and paged by the dots below instead.
  const arrow =
    'hidden size-10 shrink-0 place-items-center rounded-full border border-border bg-background text-foreground sm:grid transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-35'

  return (
    <section className="py-3 lg:py-4">
      <Container>
        <Reveal>
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 lg:p-7">
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
                  {t.home.testimonials.map((review, index) => (
                    <RailItem key={review.name} className="basis-full">
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
                          {review.name.charAt(0)}
                        </span>

                        <div className="min-w-0">
                          <Rating
                            value={5}
                            size="sm"
                            className="justify-center sm:justify-start"
                          />

                          <blockquote className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            &ldquo;{review.text}&rdquo;
                          </blockquote>

                          <figcaption className="mt-2">
                            <span className="block text-sm font-semibold text-foreground">
                              – {review.name}
                            </span>
                            <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                              {t.home.verifiedBuyer}
                              <BadgeCheck
                                className="size-3.5 text-emerald-500"
                                aria-hidden="true"
                              />
                            </span>
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
