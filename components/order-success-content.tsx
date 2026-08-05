'use client'

import Link from 'next/link'
import { CalendarDays, CheckCircle2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import { formatShipDate } from '@/lib/preorder'
import type { PaymentMethod, PaymentStatus } from '@/lib/order'

export type OrderSummary = {
  orderNumber: string
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
  const { t, locale, price } = useLanguage()

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

  return (
    <section className="mx-auto max-w-lg px-4 py-16 sm:px-6 lg:px-4">
      <div className="flex flex-col items-center text-center">
        <CheckCircle2 className="size-14 text-badge-new" strokeWidth={1.5} />
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
      </div>

      <dl className="mt-8 space-y-3 rounded-lg border border-border bg-card p-5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{t.orderSuccess.orderNumber}</dt>
          <dd className="font-semibold text-foreground">{order.orderNumber}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{t.orderSuccess.payment}</dt>
          <dd className="font-medium text-foreground">
            {t.checkout.methods[order.paymentMethod]}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{t.orderSuccess.deliveringTo}</dt>
          <dd className="text-right font-medium text-foreground">
            {order.name}
            <span className="block text-xs font-normal text-muted-foreground">
              {order.address}, {order.city} · {order.phone}
            </span>
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-border pt-3 text-muted-foreground">
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
        <div className="flex justify-between gap-4 border-t border-border pt-3 text-base font-semibold">
          <dt>{t.orderSuccess.total}</dt>
          <dd>{price(order.total)}</dd>
        </div>
      </dl>

      {/* What was paid and what the rider still has to collect. Shown for any
          order carrying an advance, which today means every booking. */}
      {order.paymentStatus !== 'none' && (
        <dl className="mt-4 space-y-2 rounded-lg bg-accent p-4 text-sm">
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

      {/* "Online payment is not live yet" — true of the card and mobile
          options, and actively wrong on a booking, whose advance has already
          been sent. Hence the explicit list rather than `!== 'cod'`. */}
      {(order.paymentMethod === 'mobile' || order.paymentMethod === 'card') && (
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-muted/60 p-4 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          {t.orderSuccess.note}
        </p>
      )}

      <Button asChild className="mt-8 w-full" size="lg">
        <Link href="/shop">{t.orderSuccess.continueShopping}</Link>
      </Button>
    </section>
  )
}
