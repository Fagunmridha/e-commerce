'use client'

import Link from 'next/link'
import { BadgeCheck, CalendarDays, FileText, Info } from 'lucide-react'
import { BrandMark } from '@/components/header/brand-mark'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import { formatShipDate } from '@/lib/preorder'
import type { Localized } from '@/lib/i18n'
import type { PaymentMethod, PaymentStatus } from '@/lib/order'
import { STORE_CONTACT } from '@/lib/site-config'

export type OrderSummary = {
  orderNumber: string
  /** ISO timestamp — a `Date` does not survive the trip to a client component. */
  placedAt: string
  items: {
    name: Localized
    quantity: number
    size: string | null
    colorEn: string | null
    unitPrice: number
  }[]
  paymentMethod: PaymentMethod
  name: string
  address: string
  city: string
  phone: string
  subtotal: number
  discount: number
  couponCode: string | null
  shipping: number
  total: number
  /** Every line is upcoming stock — this is a booking, not a normal order. */
  preorder: boolean
  advanceAmount: number
  dueAmount: number
  paymentStatus: PaymentStatus
  advanceTrxId: string | null
  /** `YYYY-MM-DD`, the latest promised date across the booked lines. */
  preorderShipsAt: string | null
}

export function OrderSuccessContent({ order }: { order: OrderSummary | null }) {
  const { t, locale, pick, price } = useLanguage()

  if (!order) {
    return (
      <section className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">{t.orderSuccess.noOrder}</p>
        <Button asChild>
          <Link href="/shop">{t.orderSuccess.continueShopping}</Link>
        </Button>
      </section>
    )
  }

  const placedOn = new Date(order.placedAt).toLocaleDateString(
    locale === 'bn' ? 'bn-BD' : 'en-GB',
    // Pinned so the server render and the browser agree on the day.
    { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Dhaka' },
  )

  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16 lg:px-4 print:max-w-none print:p-0">
      {/* Only the invoice goes to paper: the confirmation and the buttons are
          for the screen. */}
      <div className="flex flex-col items-center text-center print:hidden">
        <BadgeCheck
          className="size-14 fill-blue-600 text-white"
          strokeWidth={1.25}
          aria-hidden="true"
        />
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
          {order.preorder ? t.preorder.successTitle : t.orderSuccess.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {!order.preorder
            ? t.orderSuccess.subtitle
            : order.paymentStatus === 'none'
              ? t.preorder.successBodyCod
              : t.preorder.successBody}
        </p>
        {order.preorder && order.preorderShipsAt && (
          <p className="mt-3 flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-primary">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
            {t.preorder.shipsFrom}{' '}
            {formatShipDate(order.preorderShipsAt, locale)}
          </p>
        )}
        {/* The browser's print dialog is the download: "Save as PDF" lives
            there, and it renders Bangla with the browser's own text engine. */}
        <Button type="button" className="mt-5" onClick={() => window.print()}>
          <FileText className="size-4" aria-hidden="true" />
          {t.orderSuccess.invoiceButton}
        </Button>
      </div>

      <article className="mt-8 rounded-lg border border-border bg-card p-5 text-sm sm:p-8 print:mt-0 print:rounded-none print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
          <div>
            <BrandMark href={null} />
            <p className="mt-2 text-xs text-muted-foreground">
              {STORE_CONTACT.address}
              <span className="block">
                {STORE_CONTACT.phone} · {STORE_CONTACT.email}
              </span>
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold tracking-tight text-foreground uppercase">
              {t.orderSuccess.invoice}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t.orderSuccess.orderNumber}:{' '}
              <span className="font-semibold text-foreground">
                {order.orderNumber}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {t.orderSuccess.orderDate}: {placedOn}
            </p>
          </div>
        </header>

        <div className="grid gap-4 border-b border-border py-5 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase">
              {t.orderSuccess.billTo}
            </h3>
            <p className="mt-1 font-medium text-foreground">{order.name}</p>
            <p className="text-muted-foreground">
              {order.address}, {order.city}
            </p>
            <p className="text-muted-foreground">{order.phone}</p>
          </div>
          <div className="sm:text-right">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase">
              {t.orderSuccess.payment}
            </h3>
            <p className="mt-1 font-medium text-foreground">
              {t.checkout.methods[order.paymentMethod]}
            </p>
          </div>
        </div>

        <table className="mt-5 w-full text-left">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground uppercase">
              <th className="pb-2 font-semibold">{t.orderSuccess.item}</th>
              <th className="pb-2 text-center font-semibold">
                {t.checkout.quantityShort}
              </th>
              <th className="hidden pb-2 text-right font-semibold sm:table-cell print:table-cell">
                {t.orderSuccess.unitPrice}
              </th>
              <th className="pb-2 text-right font-semibold">
                {t.orderSuccess.amount}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {order.items.map((item, index) => (
              <tr key={index}>
                <td className="py-3 pr-3">
                  <span className="font-medium text-foreground">
                    {pick(item.name)}
                  </span>
                  {(item.size || item.colorEn) && (
                    <span className="block text-xs text-muted-foreground">
                      {[item.size, item.colorEn].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </td>
                <td className="py-3 text-center">{item.quantity}</td>
                <td className="hidden py-3 text-right sm:table-cell print:table-cell">
                  {price(item.unitPrice)}
                </td>
                <td className="py-3 text-right font-medium text-foreground">
                  {price(item.unitPrice * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="mt-2 ml-auto max-w-xs space-y-2 border-t border-border pt-4">
          <div className="flex justify-between gap-4 text-muted-foreground">
            <dt>{t.checkout.subtotal}</dt>
            <dd>{price(order.subtotal)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between gap-4 font-medium text-badge-new">
              <dt>
                {t.checkout.discount}
                {order.couponCode && (
                  <span className="ml-1 font-mono text-xs">
                    ({order.couponCode})
                  </span>
                )}
              </dt>
              <dd>−{price(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4 text-muted-foreground">
            <dt>{t.checkout.shipping}</dt>
            <dd>
              {order.shipping === 0 ? t.checkout.free : price(order.shipping)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-2 text-base font-semibold text-foreground">
            <dt>{t.orderSuccess.total}</dt>
            <dd>{price(order.total)}</dd>
          </div>
        </dl>

        {/* What was paid and what the rider still has to collect. Shown for any
            order carrying an advance, which today means every booking. */}
        {order.paymentStatus !== 'none' && (
          <dl className="mt-5 space-y-2 rounded-lg bg-accent p-4">
            <div className="flex justify-between gap-4 font-semibold text-foreground">
              <dt>{t.preorder.advancePaid}</dt>
              <dd>{price(order.advanceAmount)}</dd>
            </div>
            <div className="flex justify-between gap-4 text-muted-foreground">
              <dt>{t.preorder.dueOnDelivery}</dt>
              <dd>{price(order.dueAmount)}</dd>
            </div>
            {order.advanceTrxId && (
              <div className="flex justify-between gap-4 text-muted-foreground">
                <dt>{t.preorder.trxId}</dt>
                <dd className="font-mono text-xs break-all">
                  {order.advanceTrxId}
                </dd>
              </div>
            )}
          </dl>
        )}
      </article>

      {/* "Online payment is not live yet" — true of the card and mobile
          options, and actively wrong on a booking, whose advance has already
          been sent. Hence the explicit list rather than `!== 'cod'`. */}
      {(order.paymentMethod === 'mobile' || order.paymentMethod === 'card') && (
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-muted/60 p-4 text-xs text-muted-foreground print:hidden">
          <Info className="mt-0.5 size-4 shrink-0" />
          {t.orderSuccess.note}
        </p>
      )}

      <Button asChild variant="outline" className="mt-8 w-full print:hidden" size="lg">
        <Link href="/shop">{t.orderSuccess.continueShopping}</Link>
      </Button>
    </section>
  )
}
