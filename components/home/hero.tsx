'use client'

import Image from 'next/image'
import Link from 'next/link'
import { BadgePercent, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Container } from '@/components/layout/container'
import { WholesaleBoxes } from '@/components/home/wholesale-boxes'
import { Reveal } from '@/components/reveal'
import { useLanguage } from '@/components/language-provider'
import type { FeaturedCoupon } from '@/lib/coupon-math'
import { cn } from '@/lib/utils'

/**
 * The homepage hero: one wide panel carrying the headline and the product
 * photo, with the two standing offers stacked in a rail beside it. On phones
 * the rail drops below the panel and the offers sit side by side.
 */
export function Hero({ coupon = null }: { coupon?: FeaturedCoupon | null }) {
  const { t } = useLanguage()

  const copy = t.hero.slide
  const cards = t.home.heroCards

  return (
    <section className="pt-4 pb-5 lg:pt-6 lg:pb-8">
      <Container>
        <div className="grid gap-4 lg:grid-cols-[1fr_20rem] lg:gap-5 xl:grid-cols-[1fr_22rem]">
          <Reveal>
            <div className="relative h-full overflow-hidden rounded-2xl bg-secondary">
              <div className="grid h-full items-center sm:grid-cols-2">
                <div className="px-5 pt-8 pb-6 sm:py-12 sm:pl-10 lg:py-16 lg:pl-12">
                  <p className="text-sm font-semibold tracking-wide text-primary">
                    {copy.label}
                  </p>

                  <h1 className="mt-4 text-3xl leading-[1.12] font-extrabold tracking-tight text-balance text-foreground sm:text-4xl lg:text-5xl">
                    {copy.title}{' '}
                    <span className="text-primary">{copy.highlight}</span>
                  </h1>

                  <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground sm:mt-5 sm:text-base">
                    {copy.subtitle}
                  </p>

                  <Link
                    href="/shop"
                    className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-semibold text-primary-foreground sm:mt-8 shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    {copy.cta}
                  </Link>
                </div>

                {/* The photo fills the right half and bleeds to the panel edge. */}
                <div className="relative h-60 sm:h-full sm:min-h-[24rem] lg:min-h-[28rem]">
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:gap-5">
            <Reveal delay={100}>
              <Link
                href="/wholesale/apply"
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all sm:p-6 duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-card-hover focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <h2 className="text-xl leading-tight font-bold text-foreground">
                  {cards.wholesaleTitle}{' '}
                  <span className="block text-primary">
                    {cards.wholesaleHighlight}
                  </span>
                </h2>
                {/* Held clear of the cartons in the corner. */}
                <p className="mt-2 max-w-[60%] text-sm text-muted-foreground sm:max-w-[11rem]">
                  {cards.wholesaleBody}
                </p>
                <span className="relative mt-5 inline-flex h-9 w-fit items-center rounded-md border border-primary/40 px-4 text-xs font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  {cards.wholesaleCta}
                </span>

                <WholesaleBoxes className="pointer-events-none absolute right-3 bottom-3 w-24 origin-bottom-right transition-transform duration-500 group-hover:scale-110 sm:w-28" />
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
 * on the homepage, and applying against a ৳0 subtotal would fail any coupon
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
