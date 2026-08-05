'use client'

import { useState } from 'react'
import Image from 'next/image'
import { CalendarDays, PackageCheck, Users } from 'lucide-react'
import { SectionPanel } from '@/components/layout/section-panel'
import { Reveal } from '@/components/reveal'
import {
  RailDots,
  RailEdgeArrows,
  RailItem,
  RailTrack,
  useCardRail,
} from '@/components/layout/card-rail'
import { useLanguage } from '@/components/language-provider'
import { useCatalogue } from '@/components/catalogue-provider'
import { BookingSheet } from '@/components/preorder/booking-sheet'
import { formatShipDate } from '@/lib/preorder'
import type { Product } from '@/lib/types'

/**
 * The pre-order rail. Everything here comes from the database: which products
 * appear, the ship-from date, how many pieces are left of the run and how many
 * are already booked. An admin controls the lot from the product form and
 * /admin/preorders.
 *
 * Booking opens a sheet and goes on to its own checkout. Nothing here touches
 * the cart, which is why the shopper is never asked to empty their basket — a
 * pre-order and shelf stock cannot share an order, and keeping the two flows
 * apart is how that rule stops being the shopper's problem.
 */
export function ComingSoon() {
  const { t, pick, locale, price } = useLanguage()
  const { preorderProducts } = useCatalogue()
  const rail = useCardRail({ gridBelowSm: 2 })

  // The card the sheet was opened from; null while it is closed.
  const [selected, setSelected] = useState<Product | null>(null)

  if (preorderProducts.length === 0) return null

  const title = t.home.comingTitle

  return (
    <Reveal>
      <SectionPanel title={title} linkLabel={t.sections.viewAll} linkHref="/shop">
        <div className="relative">
          <RailTrack rail={rail} label={title}>
            {preorderProducts.map((product) => {
              const label = pick(product.name)
              const remaining = product.stock
              const soldOut = remaining <= 0
              const booked = product.preorderBooked ?? 0

              return (
                <RailItem
                  key={product.id}
                  rail={rail}
                  className="sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                >
                  <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-card-hover">
                    <div className="relative aspect-4/3 overflow-hidden bg-secondary">
                      <Image
                        src={product.image || '/placeholder.svg'}
                        alt={label}
                        fill
                        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 45vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute top-3 left-3 rounded-md bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground">
                        {t.home.comingBadge}
                      </span>
                      {soldOut && (
                        <span className="absolute top-3 right-3 rounded-md bg-destructive px-2.5 py-1 text-[11px] font-bold text-destructive-foreground">
                          {t.home.comingSoldOut}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-3 sm:p-4">
                      <h3 className="line-clamp-1 text-[13px] font-semibold text-foreground sm:text-sm">
                        {label}
                      </h3>
                      <p className="mt-1.5 text-sm font-bold text-foreground sm:text-base">
                        {price(product.price)}
                      </p>

                      <dl className="mt-3 space-y-1.5 text-[11px] text-muted-foreground sm:text-xs">
                        <div className="flex items-center gap-2">
                          <CalendarDays
                            className="size-3.5 shrink-0"
                            aria-hidden="true"
                          />
                          <dt className="sr-only">{t.home.comingDelivery}</dt>
                          <dd>
                            {t.home.comingDelivery}{' '}
                            {formatShipDate(product.preorderShipsAt, locale)}
                          </dd>
                        </div>

                        <div className="flex items-center gap-2">
                          <Users className="size-3.5 shrink-0" aria-hidden="true" />
                          <dt className="sr-only">{t.home.comingPreorders}</dt>
                          <dd>
                            {booked} {t.home.comingPreorders}
                          </dd>
                        </div>

                        <div className="flex items-center gap-2">
                          <PackageCheck
                            className="size-3.5 shrink-0"
                            aria-hidden="true"
                          />
                          <dt className="sr-only">{t.home.comingLimited}</dt>
                          <dd
                            className={
                              soldOut ? 'font-semibold text-destructive' : undefined
                            }
                          >
                            {soldOut
                              ? t.home.comingSoldOut
                              : t.home.comingLimited.replace(
                                  '{count}',
                                  String(remaining),
                                )}
                          </dd>
                        </div>
                      </dl>

                      <button
                        type="button"
                        disabled={soldOut}
                        onClick={() => setSelected(product)}
                        className="mt-4 h-10 w-full rounded-lg bg-button text-xs font-bold text-button-foreground transition-colors hover:bg-button/90 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground"
                      >
                        {soldOut ? t.home.comingSoldOutCta : t.home.comingBook}
                      </button>
                    </div>
                  </article>
                </RailItem>
              )
            })}
          </RailTrack>

          <RailEdgeArrows
            rail={rail}
            prevLabel={`${t.common.previous}: ${title}`}
            nextLabel={`${t.common.next}: ${title}`}
          />
        </div>

        <RailDots rail={rail} label={title} className="mt-6 hidden sm:flex" />
      </SectionPanel>

      <BookingSheet
        product={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      />
    </Reveal>
  )
}
