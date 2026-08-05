'use client'

import { CalendarDays, PackageCheck, Users } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { advancePct, formatShipDate, splitPayment } from '@/lib/preorder'
import { getShippingCost } from '@/lib/currency'
import type { Product } from '@/lib/types'

/**
 * The block that tells a shopper on a product page that this is upcoming stock,
 * not something on a shelf. Without it the detail page reads as an ordinary
 * product right up until checkout rejects the order.
 *
 * The advance quoted is for a single piece, which is what the price above it
 * refers to; the sheet re-quotes it against the real quantity.
 */
export function PreorderBanner({ product }: { product: Product }) {
  const { t, locale, price } = useLanguage()

  const soldOut = product.stock <= 0
  const booked = product.preorderBooked ?? 0
  const pct = advancePct(product)
  const { advance } = splitPayment(
    product.price + getShippingCost(product.price),
    product.price,
    pct,
  )

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground">
          {t.home.comingBadge}
        </span>
        <span className="text-xs font-medium text-primary">
          {t.home.comingEyebrow}
        </span>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        {t.home.comingSubtitle}
      </p>

      <dl className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
          <dt className="sr-only">{t.preorder.shipsFrom}</dt>
          <dd className="text-foreground">
            {t.preorder.shipsFrom}{' '}
            <span className="font-semibold">
              {formatShipDate(product.preorderShipsAt, locale)}
            </span>
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <Users className="size-3.5 shrink-0" aria-hidden="true" />
          <dt className="sr-only">{t.preorder.booked}</dt>
          <dd>
            {booked} {t.preorder.booked}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <PackageCheck className="size-3.5 shrink-0" aria-hidden="true" />
          <dt className="sr-only">{t.home.comingLimited}</dt>
          <dd className={soldOut ? 'font-semibold text-destructive' : undefined}>
            {soldOut
              ? t.home.comingSoldOut
              : t.home.comingLimited.replace('{count}', String(product.stock))}
          </dd>
        </div>
      </dl>

      {!soldOut && (
        <p className="mt-3 border-t border-primary/20 pt-3 text-xs font-medium text-foreground">
          {advance > 0
            ? t.preorder.bannerBookCta.replace('{amount}', price(advance))
            : t.preorder.bannerBookCtaCod}
        </p>
      )}
    </div>
  )
}
