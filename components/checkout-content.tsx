'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Banknote, CreditCard, ShoppingBag, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { CouponField } from '@/components/coupon-field'
import { DeliveryFields } from '@/components/checkout/delivery-fields'
import { useLanguage } from '@/components/language-provider'
import { useStore } from '@/components/store-provider'
import { placeOrder } from '@/app/actions/orders'
import type { PaymentMethod } from '@/lib/order'
import { cn } from '@/lib/utils'
import { buildDeliverySchema, type DeliveryValues } from '@/lib/validation/checkout'

/**
 * `advance_cod` never reaches this form — it belongs to the pre-order booking
 * checkout, which has its own page. It is listed so the map stays total.
 */
const METHOD_ICONS: Record<PaymentMethod, typeof Banknote> = {
  cod: Banknote,
  mobile: Smartphone,
  card: CreditCard,
  advance_cod: Smartphone,
}

export function CheckoutContent() {
  const router = useRouter()
  const { t, pick, price } = useLanguage()
  const { hydrated, lines, subtotal, shipping, discount, total, coupon, clearCart } =
    useStore()
  const [method, setMethod] = useState<PaymentMethod>('cod')
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<DeliveryValues>({
    resolver: zodResolver(buildDeliverySchema(t.checkout.errors)),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      city: '',
      notes: '',
    },
  })

  // Persist the order in the database via a server action. Prices are
  // recomputed server-side, so the confirmation page shows authoritative totals.
  async function onSubmit(values: DeliveryValues) {
    setSubmitting(true)

    try {
      const { orderNumber } = await placeOrder({
        name: values.name,
        phone: values.phone,
        address: values.address,
        city: values.city,
        notes: values.notes || undefined,
        paymentMethod: method,
        items: lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          size: line.size,
          colorEn: line.colorEn,
        })),
        // Just the code — the server re-checks it and prices the discount.
        couponCode: coupon?.code ?? null,
      })

      clearCart()
      router.push(`/checkout/success?order=${orderNumber}`)
    } catch {
      setSubmitting(false)
      toast.error(t.checkout.placeOrder)
    }
  }

  if (!hydrated) {
    return <PageHeader pageKey="checkout" />
  }

  if (lines.length === 0) {
    return (
      <>
        <PageHeader pageKey="checkout" />
        <section className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
          <ShoppingBag
            className="size-14 text-muted-foreground/40"
            strokeWidth={1.25}
          />
          <div>
            <p className="font-medium text-foreground">{t.checkout.emptyTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.checkout.emptyHint}
            </p>
          </div>
          <Button asChild>
            <Link href="/shop">{t.checkout.emptyCta}</Link>
          </Button>
        </section>
      </>
    )
  }

  const methods: { value: PaymentMethod; label: string; hint: string }[] = [
    { value: 'cod', label: t.checkout.methods.cod, hint: t.checkout.methods.codHint },
  ]

  return (
    <>
      <PageHeader pageKey="checkout" />

      <section className="mx-auto grid max-w-page gap-10 px-4 py-12 sm:px-6 lg:grid-cols-5 lg:px-4">
        <div className="lg:col-span-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-foreground">
                  {t.checkout.deliveryDetails}
                </h2>

                <DeliveryFields layout="two-column" />
              </div>

              <fieldset className="space-y-3">
                <legend className="mb-3 text-lg font-semibold text-foreground">
                  {t.checkout.paymentMethod}
                </legend>

                {methods.map((option) => {
                  const Icon = METHOD_ICONS[option.value]
                  const checked = method === option.value

                  return (
                    <label
                      key={option.value}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors',
                        checked
                          ? 'border-primary bg-accent'
                          : 'border-border hover:border-primary',
                      )}
                    >
                      <input
                        type="radio"
                        name="payment-method"
                        value={option.value}
                        checked={checked}
                        onChange={() => setMethod(option.value)}
                        className="size-4 accent-primary"
                      />
                      <Icon
                        className={cn(
                          'size-5',
                          checked ? 'text-primary' : 'text-muted-foreground',
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground">
                          {option.label}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {option.hint}
                        </span>
                      </span>
                    </label>
                  )
                })}
              </fieldset>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? t.checkout.placing : t.checkout.placeOrder}
              </Button>
            </form>
          </Form>
        </div>

        {/* Order summary */}
        <aside className="lg:col-span-2">
          <div className="rounded-lg border border-border bg-card p-5 lg:sticky lg:top-24">
            <h2 className="text-lg font-semibold text-foreground">
              {t.checkout.orderSummary}
            </h2>

            <ul className="mt-4 space-y-3 border-b border-border pb-4">
              {lines.map((line) => {
                const name = pick(line.product.name)
                const color = line.product.colors?.find(
                  (item) => item.name.en === line.colorEn,
                )

                return (
                  <li key={line.key} className="flex gap-3">
                    <img
                      src={line.product.image || '/placeholder.svg'}
                      alt={name}
                      className="size-14 shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium text-foreground">
                        {name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {line.size && `${t.cart.size}: ${line.size}`}
                        {line.size && color && ' • '}
                        {color && pick(color.name)}
                        {' • '}
                        {t.checkout.quantityShort}: {line.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold whitespace-nowrap text-foreground">
                      {price(line.lineTotal)}
                    </p>
                  </li>
                )
              })}
            </ul>

            <CouponField className="mt-4 border-t border-border pt-4" />

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <dt>{t.checkout.subtotal}</dt>
                <dd>{price(subtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between font-medium text-badge-new">
                  <dt>{t.checkout.discount}</dt>
                  <dd>−{price(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <dt>{t.checkout.shipping}</dt>
                <dd
                  className={cn(shipping === 0 && 'font-medium text-badge-new')}
                >
                  {shipping === 0 ? t.checkout.free : price(shipping)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold text-foreground">
                <dt>{t.checkout.total}</dt>
                <dd>{price(total)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </section>
    </>
  )
}
