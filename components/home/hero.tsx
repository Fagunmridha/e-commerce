'use client'

import Image from 'next/image'
import Link from 'next/link'
import { BadgePercent, Package } from 'lucide-react'
import { Container } from '@/components/layout/container'
import { Reveal } from '@/components/reveal'
import { useLanguage } from '@/components/language-provider'

/**
 * The homepage hero: one wide panel carrying the headline and the product
 * photo, with the two standing offers stacked in a rail beside it. On phones
 * the rail drops below the panel and the offers sit side by side.
 */
export function Hero() {
  const { t } = useLanguage()

  const copy = t.hero.slides[0]
  const cards = t.home.heroCards

  return (
    <section className="pt-5 pb-8 lg:pt-6">
      <Container>
        <div className="grid gap-5 lg:grid-cols-[1fr_20rem] xl:grid-cols-[1fr_22rem]">
          <Reveal>
            <div className="relative h-full overflow-hidden rounded-2xl bg-secondary">
              <div className="grid h-full items-center sm:grid-cols-2">
                <div className="px-6 pt-10 pb-8 sm:py-12 sm:pl-10 lg:py-16 lg:pl-12">
                  <p className="text-sm font-semibold tracking-wide text-primary">
                    {copy.label}
                  </p>

                  <h1 className="mt-4 text-3xl leading-[1.12] font-extrabold tracking-tight text-balance text-foreground sm:text-4xl lg:text-5xl">
                    {copy.title}{' '}
                    <span className="text-primary">{copy.highlight}</span>
                  </h1>

                  <p className="mt-5 max-w-xs text-base leading-relaxed text-muted-foreground">
                    {copy.subtitle}
                  </p>

                  <Link
                    href="/shop"
                    className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    {copy.cta}
                  </Link>
                </div>

                {/* The photo fills the right half and bleeds to the panel edge. */}
                <div className="relative h-56 sm:h-full sm:min-h-[24rem] lg:min-h-[28rem]">
                  <Image
                    src="/hero_clothing_rack.png"
                    alt=""
                    fill
                    // The hero image is the homepage LCP element.
                    priority
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                    className="object-cover object-center"
                  />
                </div>
              </div>
            </div>
          </Reveal>

          {/* Offer rail — two cards on top of each other beside the panel. */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <Reveal delay={100}>
              <Link
                href="/contact"
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-card-hover focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <h2 className="text-xl leading-tight font-bold text-foreground">
                  {cards.wholesaleTitle}
                </h2>
                <p className="mt-2 max-w-[11rem] text-sm text-muted-foreground">
                  {cards.wholesaleBody}
                </p>
                <span className="mt-5 inline-flex h-9 w-fit items-center rounded-md border border-primary/40 px-4 text-xs font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  {cards.wholesaleCta}
                </span>

                <Package
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-3 -bottom-3 size-28 text-primary/12 transition-transform duration-500 group-hover:scale-110"
                  strokeWidth={1.25}
                />
              </Link>
            </Reveal>

            <Reveal delay={180}>
              <Link
                href="/shop"
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-card-hover focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <p className="text-base font-bold text-foreground">
                  {cards.couponEyebrow}
                </p>
                <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-primary">
                  {cards.couponHighlight}
                </p>
                <p className="mt-2 max-w-[11rem] text-sm text-muted-foreground">
                  {cards.couponBody}
                </p>
                <span className="mt-5 inline-flex h-9 w-fit items-center rounded-md border border-primary/40 px-4 text-xs font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  {cards.couponCta}
                </span>

                <BadgePercent
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-3 -bottom-3 size-28 text-primary/12 transition-transform duration-500 group-hover:scale-110"
                  strokeWidth={1.25}
                />
              </Link>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  )
}
