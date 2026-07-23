'use client'

import Link from 'next/link'
import { CheckCircle2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import type { PaymentMethod } from '@/lib/order'

export type OrderSummary = {
  orderNumber: string
  paymentMethod: PaymentMethod
  name: string
  address: string
  city: string
  phone: string
  total: number
}

export function OrderSuccessContent({ order }: { order: OrderSummary | null }) {
  const { t, price } = useLanguage()

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
    <section className="mx-auto max-w-lg px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center text-center">
        <CheckCircle2 className="size-14 text-badge-new" strokeWidth={1.5} />
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
          {t.orderSuccess.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t.orderSuccess.subtitle}
        </p>
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
        <div className="flex justify-between gap-4 border-t border-border pt-3 text-base font-semibold">
          <dt>{t.orderSuccess.total}</dt>
          <dd>{price(order.total)}</dd>
        </div>
      </dl>

      {order.paymentMethod !== 'cod' && (
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
