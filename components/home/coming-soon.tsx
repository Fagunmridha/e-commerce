'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { CalendarDays, Users } from 'lucide-react'
import { toast } from 'sonner'
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
import { useStore } from '@/components/store-provider'

/**
 * PLACEHOLDER — the products table has no pre-order columns, so the shipping
 * window below is generated from this lead time rather than read from the
 * database. Add real `preorderShipsAt` / `preorderCount` columns before taking
 * pre-orders from customers; see the note in the section body.
 */
const PREORDER_LEAD_DAYS = 18
const PREORDER_STAGGER_DAYS = 5

/**
 * A pre-order rail of upcoming stock. Booking adds the item to the cart, which
 * is the same flow as a normal purchase.
 */
export function ComingSoon() {
  const { t, pick, locale, price } = useLanguage()
  const { products: allProducts } = useCatalogue()
  const { addToCart } = useStore()
  const rail = useCardRail({ gridBelowSm: 2 })

  const products = useMemo(
    () => [...allProducts].reverse().slice(0, 6),
    [allProducts],
  )

  // Dates depend on "today", so they are computed after mount — otherwise the
  // server and client HTML disagree and React throws a hydration error.
  const [shipDates, setShipDates] = useState<string[] | null>(null)

  useEffect(() => {
    const format = new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-GB', {
      day: 'numeric',
      month: 'short',
    })

    setShipDates(
      products.map((_, index) => {
        const date = new Date()
        date.setDate(
          date.getDate() + PREORDER_LEAD_DAYS + index * PREORDER_STAGGER_DAYS,
        )
        return format.format(date)
      }),
    )
  }, [products, locale])

  if (products.length === 0) return null

  const title = t.home.comingTitle

  return (
    <Reveal>
      <SectionPanel title={title} linkLabel={t.sections.viewAll} linkHref="/shop">
        <div className="relative">
          <RailTrack rail={rail} label={title}>
            {products.map((product, index) => {
              const label = pick(product.name)

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
                          {/* Reserve the row before the date lands post-mount. */}
                          <dd>
                            {t.home.comingDelivery}{' '}
                            {shipDates?.[index] ?? '—'}
                          </dd>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="size-3.5 shrink-0" aria-hidden="true" />
                          <dt className="sr-only">{t.home.comingPreorders}</dt>
                          <dd>0 {t.home.comingPreorders}</dd>
                        </div>
                      </dl>

                      <button
                        type="button"
                        onClick={() => {
                          addToCart({
                            productId: product.id,
                            quantity: 1,
                            size: product.sizes?.[0],
                            colorEn: product.colors?.[0]?.name.en,
                          })
                          toast.success(t.product.added, { description: label })
                        }}
                        className="mt-4 h-10 w-full rounded-lg bg-primary text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                      >
                        {t.home.comingBook}
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
    </Reveal>
  )
}
