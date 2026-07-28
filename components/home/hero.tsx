'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BadgePercent, Copy, Package } from 'lucide-react'
import { toast } from 'sonner'
import { Container } from '@/components/layout/container'
import { Reveal } from '@/components/reveal'
import { useLanguage } from '@/components/language-provider'
import type { HeroSlide } from '@/lib/banners'
import type { FeaturedCoupon } from '@/lib/coupon-math'
import { cn } from '@/lib/utils'

const ROTATE_MS = 7000
const FALLBACK_IMAGE = '/hero_clothing_rack.png'

/**
 * The homepage hero: one wide panel carrying the headline and the product
 * photo, with the two standing offers stacked in a rail beside it. On phones
 * the rail drops below the panel and the offers sit side by side.
 *
 * Slides come from the `banners` table so an admin can put up an Eid or Puja
 * panel — and schedule it — without a deploy. When the table has nothing live,
 * the dictionary copy stands in, so the page above the fold is never empty.
 */
export function Hero({
  slides = [],
  coupon = null,
}: {
  slides?: HeroSlide[]
  coupon?: FeaturedCoupon | null
}) {
  const { t, pick } = useLanguage()

  const cards = t.home.heroCards

  // Dictionary fallback for an empty `banners` table. `t` is already resolved
  // to the active locale, so each field is mirrored into both slots — whichever
  // one `pick` reaches holds the right language. Keeping it in HeroSlide shape
  // means there is only one hero layout to maintain.
  const fallback = useMemo<HeroSlide[]>(() => {
    const same = (value: string) => ({ en: value, bn: value })
    return t.hero.slides.map((slide, index) => ({
      id: `fallback-${index}`,
      image: FALLBACK_IMAGE,
      label: same(slide.label),
      title: same(slide.title),
      highlight: same(slide.highlight),
      subtitle: same(slide.subtitle),
      ctaLabel: same(slide.cta),
      ctaHref: '/shop',
    }))
  }, [t.hero.slides])

  const live = slides.length > 0 ? slides : fallback

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  // A shrinking list (admin deactivates a banner) must not strand the index.
  useEffect(() => {
    setIndex((current) => (current < live.length ? current : 0))
  }, [live.length])

  const reduceMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (live.length < 2 || paused || reduceMotion) return
    const timer = setInterval(
      () => setIndex((current) => (current + 1) % live.length),
      ROTATE_MS,
    )
    return () => clearInterval(timer)
  }, [live.length, paused, reduceMotion])

  const current = live[index] ?? live[0]
  if (!current) return null

  const label = current.label && pick(current.label)

  return (
    <section className="pt-4 pb-5 lg:pt-6 lg:pb-8">
      <Container>
        <div className="grid gap-4 lg:grid-cols-[1fr_20rem] lg:gap-5 xl:grid-cols-[1fr_22rem]">
          <Reveal>
            <div
              className="relative h-full overflow-hidden rounded-2xl bg-secondary"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onFocusCapture={() => setPaused(true)}
              onBlurCapture={() => setPaused(false)}
            >
              <div className="grid h-full items-center sm:grid-cols-2">
                <div className="px-5 pt-8 pb-6 sm:py-12 sm:pl-10 lg:py-16 lg:pl-12">
                  {label && (
                    <p className="text-sm font-semibold tracking-wide text-primary">
                      {label}
                    </p>
                  )}

                  <h1 className="mt-4 text-3xl leading-[1.12] font-extrabold tracking-tight text-balance text-foreground sm:text-4xl lg:text-5xl">
                    {pick(current.title)}{' '}
                    {current.highlight && (
                      <span className="text-primary">
                        {pick(current.highlight)}
                      </span>
                    )}
                  </h1>

                  {current.subtitle && (
                    <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground sm:mt-5 sm:text-base">
                      {pick(current.subtitle)}
                    </p>
                  )}

                  <Link
                    href={current.ctaHref}
                    className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold text-primary-foreground sm:mt-8 shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    {current.ctaLabel ? pick(current.ctaLabel) : t.hero.slides[0].cta}
                  </Link>

                  {live.length > 1 && (
                    <div className="mt-8 flex gap-2">
                      {live.map((slide, dot) => (
                        <button
                          key={slide.id}
                          type="button"
                          onClick={() => setIndex(dot)}
                          aria-label={`${t.hero.goToSlide} ${dot + 1}`}
                          aria-current={dot === index}
                          className={cn(
                            'h-1.5 rounded-full transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                            dot === index
                              ? 'w-6 bg-primary'
                              : 'w-1.5 bg-foreground/20 hover:bg-foreground/40',
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* The photo fills the right half and bleeds to the panel edge.
                    All slides are stacked and cross-faded so the panel height
                    never jumps mid-rotation. */}
                <div className="relative h-60 sm:h-full sm:min-h-[24rem] lg:min-h-[28rem]">
                  {live.map((slide, position) => (
                    <Image
                      key={slide.id}
                      src={slide.image}
                      alt=""
                      fill
                      // The first slide's image is the homepage LCP element.
                      priority={position === 0}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                      className={cn(
                        'object-cover object-center transition-opacity duration-700',
                        position === index ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Offer rail — two cards on top of each other beside the panel. */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:gap-5">
            <Reveal delay={100}>
              <Link
                href="/contact"
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all sm:p-6 duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-card-hover focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <h2 className="text-xl leading-tight font-bold text-foreground">
                  {cards.wholesaleTitle}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground sm:max-w-[11rem]">
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
              <CouponCard coupon={coupon} />
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  )
}

const CARD_CLASS =
  'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all sm:p-6 duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-card-hover'

/**
 * The offer card beside the hero. With a coupon flagged "show on homepage" it
 * advertises the real code; otherwise it falls back to the static marketing
 * copy, so the slot is never empty.
 *
 * Clicking copies the code rather than applying it: the cart is usually empty
 * on the homepage, and applying against a $0 subtotal would fail any coupon
 * with a minimum — the shopper would see a discount and an error at once.
 */
function CouponCard({ coupon }: { coupon: FeaturedCoupon | null }) {
  const { t, pick, price } = useLanguage()
  const cards = t.home.heroCards

  const decoration = (
    <BadgePercent
      aria-hidden="true"
      className="pointer-events-none absolute -right-3 -bottom-3 size-28 text-primary/12 transition-transform duration-500 group-hover:scale-110"
      strokeWidth={1.25}
    />
  )

  if (!coupon) {
    return (
      <Link
        href="/shop"
        className={cn(
          CARD_CLASS,
          'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
        )}
      >
        <p className="text-base font-bold text-foreground">
          {cards.couponEyebrow}
        </p>
        <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-primary">
          {cards.couponHighlight}
        </p>
        <p className="mt-2 text-sm text-muted-foreground sm:max-w-[11rem]">
          {cards.couponBody}
        </p>
        <span className="mt-5 inline-flex h-9 w-fit items-center rounded-md border border-primary/40 px-4 text-xs font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          {cards.couponCta}
        </span>
        {decoration}
      </Link>
    )
  }

  const body = coupon.description
    ? pick(coupon.description)
    : coupon.minOrder > 0
      ? t.coupon.minOrder.replace('{amount}', price(coupon.minOrder))
      : t.coupon.noMinimum

  // A div, not a Link: the copy button and the shop link are separate targets,
  // and nesting a button inside an anchor is invalid.
  return (
    <div className={CARD_CLASS}>
      <p className="text-base font-bold text-foreground">
        {t.coupon.getExtra}
      </p>
      <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-primary">
        {coupon.headline}
      </p>
      <p className="mt-2 text-sm text-muted-foreground sm:max-w-[11rem]">
        {body}
      </p>

      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(coupon.code)
          toast.success(t.coupon.copied)
        }}
        className="relative mt-4 inline-flex h-9 w-fit items-center gap-2 rounded-md border border-dashed border-primary/50 bg-primary/5 px-3 font-mono text-sm font-bold tracking-wider text-primary transition-colors hover:bg-primary/10 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        aria-label={`${t.coupon.copyCode}: ${coupon.code}`}
      >
        {coupon.code}
        <Copy className="size-3.5" aria-hidden="true" />
      </button>

      <Link
        href="/shop"
        className="relative mt-3 inline-flex h-9 w-fit items-center rounded-md border border-primary/40 px-4 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {cards.couponCta}
      </Link>

      {decoration}
    </div>
  )
}

/** Respects the OS "reduce motion" setting for the auto-rotation. */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  const query = useRef<MediaQueryList | null>(null)

  useEffect(() => {
    query.current = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.current.matches)

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    query.current.addEventListener('change', onChange)
    return () => query.current?.removeEventListener('change', onChange)
  }, [])

  return reduced
}
