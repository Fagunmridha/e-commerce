'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Banknote, CreditCard, Lock, ShoppingBag, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
  const {
    hydrated,
    lines,
    subtotal,
    shipping,
    discount,
    total,
    coupon,
    zone,
    setZone,
    clearCart,
  } = useStore()
  const [method, setMethod] = useState<PaymentMethod>('cod')
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<DeliveryValues>({
    resolver: zodResolver(buildDeliverySchema(t.checkout.errors)),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      city: '',
      // Seeded from the store so a returning shopper's remembered zone is
      // already selected rather than silently reset to Dhaka.
      zone,
      notes: '',
    },
  })

  // The summary is rendered from the store, not from the form, because the cart
  // drawer quotes delivery too. Mirroring the radio back keeps the Delivery line
  // beside this form moving with it.
  const selectedZone = form.watch('zone')
  useEffect(() => {
    if (selectedZone !== zone) setZone(selectedZone)
  }, [selectedZone, zone, setZone])

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
        zone: values.zone,
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

      {/* A tinted ground so the white cards read as raised panels rather than
          as sections of one flat page. Scoped to checkout rather than moved
          into `--background`, which every other page is designed against. */}
      <div className="bg-secondary/40">
        <Form {...form}>
          {/* The form wraps both columns, which is what lets the primary button
              live in the summary card beside the total it is charging. */}
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mx-auto grid max-w-page gap-8 px-4 py-10 sm:px-6 md:py-14 lg:grid-cols-[1.5fr_1fr] lg:px-4 xl:gap-12"
          >
            <div className="space-y-6">
              <Card className="gap-0 border-none p-6 shadow-sm md:p-8">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  {t.checkout.deliveryDetails}
                </h2>

                <div className="mt-6 space-y-6">
                  <DeliveryFields layout="two-column" />
                </div>
              </Card>

              <Card className="gap-0 border-none p-6 shadow-sm md:p-8">
                <fieldset>
                  <legend className="text-xl font-semibold tracking-tight text-foreground">
                    {t.checkout.paymentMethod}
                  </legend>

                  <div className="mt-6 space-y-3">
                    {methods.map((option) => {
                      const Icon = METHOD_ICONS[option.value]
                      const checked = method === option.value

                      return (
                        <label
                          key={option.value}
                          className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors',
                            checked
                              ? 'border-primary bg-accent ring-2 ring-ring/20'
                              : 'border-border hover:border-primary hover:bg-accent/40',
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
                  </div>
                </fieldset>

                {/* The reassurance line says what is true here: there is no
                    gateway, so nothing is charged online in the first place. */}
                <p className="mt-4 flex items-center gap-2 rounded-md bg-badge-new/10 p-3 text-sm text-badge-new">
                  <Lock className="size-4 shrink-0" aria-hidden="true" />
                  {t.checkout.secureNote}
                </p>
              </Card>
            </div>

            {/* Order summary. Sticky so the total and the button stay on screen
                while the form above is being filled in. */}
            <aside>
              <Card className="gap-0 border-none p-6 shadow-sm lg:sticky lg:top-24">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  {t.checkout.orderSummary}
                </h2>

                <ul className="mt-2 divide-y divide-border">
                  {lines.map((line) => {
                    const name = pick(line.product.name)
                    const color = line.product.colors?.find(
                      (item) => item.name.en === line.colorEn,
                    )

                    return (
                      <li key={line.key} className="flex items-center gap-4 py-4">
                        <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
                          <Image
                            src={line.product.image || '/placeholder.svg'}
                            alt={name}
                            fill
                            sizes="56px"
                            className="object-cover transition-transform duration-300 hover:scale-105"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-medium text-foreground">
                            {name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {line.size && `${t.cart.size}: ${line.size}`}
                            {line.size && color && ' • '}
                            {color && pick(color.name)}
                            {' • '}
                            {t.checkout.quantityShort}: {line.quantity}
                          </p>
                        </div>
                        <p className="ml-auto text-sm font-semibold whitespace-nowrap text-foreground">
                          {price(line.lineTotal)}
                        </p>
                      </li>
                    )
                  })}
                </ul>

                <CouponField className="mt-2 border-t border-border pt-5" />

                <dl className="mt-5 space-y-2.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <dt>{t.checkout.subtotal}</dt>
                    <dd className="text-foreground">{price(subtotal)}</dd>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between font-medium text-badge-new">
                      <dt>{t.checkout.discount}</dt>
                      <dd>−{price(discount)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <dt>{t.checkout.shipping}</dt>
                    <dd className="text-foreground">
                      {shipping === 0 ? t.checkout.free : price(shipping)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-border pt-3.5">
                    <dt className="text-lg font-bold text-foreground">
                      {t.checkout.total}
                    </dt>
                    <dd className="text-lg font-bold text-foreground">
                      {price(total)}
                    </dd>
                  </div>
                </dl>

                <Button
                  type="submit"
                  className="mt-6 h-14 w-full rounded-lg text-base font-semibold shadow-md"
                  disabled={submitting}
                >
                  {submitting
                    ? t.checkout.placing
                    : t.checkout.placeOrderTotal.replace('{amount}', price(total))}
                </Button>
              </Card>
            </aside>
          </form>
        </Form>
      </div>
    </>
  )
}
