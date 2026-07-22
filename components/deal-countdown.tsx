'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Rating } from '@/components/rating'
import { useLanguage } from '@/components/language-provider'
import { PRODUCTS } from '@/lib/data'

/** The steepest discount in the catalogue is this week's deal. */
const DEAL = PRODUCTS.filter((product) => product.oldPrice).sort(
  (a, b) =>
    (b.oldPrice! - b.price) / b.oldPrice! - (a.oldPrice! - a.price) / a.oldPrice!,
)[0]

type Remaining = { days: number; hours: number; minutes: number; seconds: number }

/** Counts down to the end of the current week (next Sunday, local midnight). */
function timeToWeekEnd(): Remaining {
  const now = new Date()
  const end = new Date(now)
  end.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7))
  end.setHours(0, 0, 0, 0)

  const ms = Math.max(0, end.getTime() - now.getTime())
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms / 3_600_000) % 24),
    minutes: Math.floor((ms / 60_000) % 60),
    seconds: Math.floor((ms / 1000) % 60),
  }
}

export function DealCountdown() {
  const { t, pick, price } = useLanguage()
  // Starts null so the server and the first client render agree; the clock
  // only appears once we are safely on the client.
  const [remaining, setRemaining] = useState<Remaining | null>(null)

  useEffect(() => {
    setRemaining(timeToWeekEnd())
    const id = window.setInterval(() => setRemaining(timeToWeekEnd()), 1000)
    return () => window.clearInterval(id)
  }, [])

  if (!DEAL) return null

  const copy = t.home.deal
  const units = [
    { value: remaining?.days, label: copy.days },
    { value: remaining?.hours, label: copy.hours },
    { value: remaining?.minutes, label: copy.minutes },
    { value: remaining?.seconds, label: copy.seconds },
  ]

  return (
    <section className="bg-foreground text-background">
      <div className="mx-auto grid max-w-page items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-10 lg:py-20">
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] text-primary uppercase">
            {copy.eyebrow}
          </p>
          <h2 className="mt-3 text-display-sm text-background">
            {pick(DEAL.name)}
          </h2>
          <p className="mt-3 max-w-md text-sm text-background/70">{copy.title}</p>

          <Rating value={DEAL.rating} reviews={DEAL.reviews} className="mt-4" />

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-background">
              {price(DEAL.price)}
            </span>
            {DEAL.oldPrice && (
              <>
                <span className="text-lg text-background/50 line-through">
                  {price(DEAL.oldPrice)}
                </span>
                <span className="rounded bg-badge-sale px-2 py-0.5 text-xs font-bold text-badge-sale-foreground">
                  {copy.saveLabel} {price(DEAL.oldPrice - DEAL.price)}
                </span>
              </>
            )}
          </div>

          {/* Reserve the row height so the layout does not jump on hydration. */}
          <div className="mt-7 flex gap-3">
            {units.map((unit) => (
              <div
                key={unit.label}
                className="min-w-[68px] rounded-xl bg-background/10 px-3 py-3 text-center backdrop-blur"
              >
                <p className="text-2xl font-extrabold tabular-nums text-background">
                  {unit.value === undefined
                    ? '––'
                    : String(unit.value).padStart(2, '0')}
                </p>
                <p className="mt-0.5 text-[10px] font-semibold tracking-wider text-background/60 uppercase">
                  {unit.label}
                </p>
              </div>
            ))}
          </div>

          <Link
            href={`/product/${DEAL.id}`}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-bold tracking-wide text-primary-foreground uppercase transition-transform hover:-translate-y-0.5"
          >
            {copy.cta}
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="relative">
          <img
            src={DEAL.image}
            alt={pick(DEAL.name)}
            loading="lazy"
            className="aspect-4/5 w-full rounded-2xl object-cover shadow-2xl lg:ml-auto lg:max-w-md"
          />
        </div>
      </div>
    </section>
  )
}
