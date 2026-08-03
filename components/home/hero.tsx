'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Container } from '@/components/layout/container'
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
            <div className="relative h-full overflow-hidden rounded-2xl bg-surface">
              {/* The photo takes the larger share so it starts near the
                  headline instead of waiting for the halfway line — but not so
                  large that "For Your Everyday Needs" no longer fits on its
                  own line. */}
              <div className="grid h-full items-center sm:grid-cols-[1fr_1.05fr]">
                <div className="px-5 pt-8 pb-6 sm:py-12 sm:pl-10 lg:py-16 lg:pl-12">
                  <p className="text-sm font-semibold tracking-wide text-primary lg:text-base">
                    {copy.label}
                  </p>

                  {/* Two fixed lines rather than a balanced block: the break
                      belongs after "Products", not wherever the column width
                      lands it.

                      The size is fluid rather than stepped because the longer
                      line — "For Your Everyday Needs" — has to survive on one
                      line, and a step that fits at 1920 still wraps at 1440.
                      The clamp tracks the column instead, capped at 3.25rem so
                      it stops growing once there is room to spare. */}
                  <h1 className="mt-4 text-[1.75rem] leading-[1.12] font-extrabold tracking-tight text-foreground sm:text-[clamp(1.5rem,calc(3.2vw-2px),2.25rem)] lg:text-[clamp(1.5rem,calc(3.9vw-23px),3.25rem)]">
                    <span className="block">{copy.title}</span>
                    <span className="block">
                      {copy.titleLead}{' '}
                      <span className="text-primary">{copy.highlight}</span>
                    </span>
                  </h1>

                  <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground sm:mt-5 sm:text-base lg:text-lg">
                    {copy.subtitle}
                  </p>

                  <Link
                    href="/shop"
                    className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-button px-8 text-sm font-semibold text-button-foreground sm:mt-8 shadow-lg shadow-button/25 transition-all hover:-translate-y-0.5 hover:bg-button/90 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    {copy.cta}
                  </Link>
                </div>

                {/* The photo takes the wider column. The cut-out is
                    transparent, so it sits straight on the panel's own surface
                    in either theme — no plate, no seam.

                    Contain, not cover: the rack spans the full height of its
                    own asset, so there is no slack to crop into — cover, or
                    any scale past it, eats the top rail and the hangers first.
                    The column carries the size instead, and the nudge left
                    closes the gap to the headline. */}
                <div className="relative h-72 sm:h-full sm:min-h-[27rem] lg:min-h-[34rem]">
                  <Image
                    src="/plant-clothes.png"
                    alt=""
                    fill
                    // The hero image is the homepage LCP element.
                    priority
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                    className="-translate-x-[3%] object-contain object-center"
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
                <span className="relative mt-5 inline-flex h-9 w-fit items-center rounded-md border border-button/40 px-4 text-xs font-semibold text-button transition-colors group-hover:bg-button group-hover:text-button-foreground">
                  {cards.wholesaleCta}
                </span>

                {/* The carton stack is a transparent PNG, so it drops straight
                    onto the card with no plate behind it. */}
                <Image
                  src="/wholesale-boxes.png"
                  alt=""
                  width={1024}
                  height={1024}
                  sizes="112px"
                  className="pointer-events-none absolute right-3 bottom-3 w-24 origin-bottom-right transition-transform duration-500 group-hover:scale-110 sm:w-28"
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
 * on the homepage, and applying against a ৳0 subtotal would fail any coupon
 * with a minimum — the shopper would see a discount and an error at once.
 */
function CouponCard({ coupon }: { coupon: FeaturedCoupon | null }) {
  const { t, pick, price } = useLanguage()
  const cards = t.home.heroCards

  const decoration = (
    <Image
      src="/icons/coupon-tickets.png"
      alt=""
      width={512}
      height={398}
      sizes="112px"
      className="pointer-events-none absolute right-4 bottom-5 w-24 origin-bottom-right transition-transform duration-500 group-hover:scale-110 sm:w-28"
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
        <span className="mt-5 inline-flex h-9 w-fit items-center rounded-md border border-button/40 px-4 text-xs font-semibold text-button transition-colors group-hover:bg-button group-hover:text-button-foreground">
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
        className="relative mt-4 inline-flex h-9 w-fit items-center gap-2 rounded-md border border-dashed border-button/50 bg-button/5 px-3 font-mono text-sm font-bold tracking-wider text-button transition-colors hover:bg-button/10 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        aria-label={`${t.coupon.copyCode}: ${coupon.code}`}
      >
        {coupon.code}
        <Copy className="size-3.5" aria-hidden="true" />
      </button>

      <Link
        href="/shop"
        className="relative mt-3 inline-flex h-9 w-fit items-center rounded-md border border-button/40 px-4 text-xs font-semibold text-button transition-colors hover:bg-button hover:text-button-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {cards.couponCta}
      </Link>

      {decoration}
    </div>
  )
}
