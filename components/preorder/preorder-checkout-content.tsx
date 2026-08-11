'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarDays, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { PageHeader } from '@/components/page-header'
import { CopyButton } from '@/components/copy-button'
import { LoadingOverlay } from '@/components/loading-overlay'
import { DeliveryFields } from '@/components/checkout/delivery-fields'
import { useLanguage } from '@/components/language-provider'
import { placeOrder } from '@/app/actions/orders'
import { formatShipDate, splitPayment } from '@/lib/preorder'
import { DEFAULT_ZONE, getShippingCost } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { buildAdvanceSchema, buildDeliverySchema } from '@/lib/validation/checkout'
import type { AdvanceMethod } from '@/lib/order'
import type { Product } from '@/lib/types'

/**
 * The booking form is one schema, not two: react-hook-form validates delivery
 * and advance fields together, so a shopper who fills in the address but
 * mistypes the transaction ID sees both states at once rather than discovering
 * the second failure only after fixing the first.
 */
function buildSchema(
  deliveryErrors: Parameters<typeof buildDeliverySchema>[0],
  advanceErrors: Parameters<typeof buildAdvanceSchema>[0],
  needsAdvance: boolean,
) {
  const delivery = buildDeliverySchema(deliveryErrors)
  if (!needsAdvance) {
    // A 0% pre-order is a real configuration — pure cash on delivery — and it
    // must not demand a transaction ID for a payment nobody made.
    return delivery.extend({
      method: z.enum(['bkash', 'nagad']).optional(),
      trxId: z.string().optional(),
      senderPhone: z.string().optional(),
    })
  }
  return delivery.merge(buildAdvanceSchema(advanceErrors))
}

type BookingValues = z.infer<ReturnType<typeof buildSchema>>

export function PreorderCheckoutContent({
  product,
  quantity,
  size,
  colorEn,
  subtotal,
  advancePct,
  bkashNumber,
  nagadNumber,
}: {
  product: Product
  quantity: number
  size?: string
  colorEn?: string
  /** The goods value, priced on the server. Delivery is added here. */
  subtotal: number
  advancePct: number
  bkashNumber: string
  nagadNumber: string
}) {
  const router = useRouter()
  const { t, pick, locale, price } = useLanguage()
  const [submitting, setSubmitting] = useState(false)

  // Read off the advance percentage rather than the advance amount: the amount
  // now depends on the zone, and a schema that swapped shape mid-form — asking
  // for a transaction ID only once someone picked "Outside Dhaka" — would be a
  // form that changes its own rules under the shopper.
  const needsAdvance = advancePct > 0
  const form = useForm<BookingValues>({
    resolver: zodResolver(
      buildSchema(t.checkout.errors, t.preorder.errors, needsAdvance),
    ),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      city: '',
      zone: DEFAULT_ZONE,
      notes: '',
      method: 'bkash',
      trxId: '',
      senderPhone: '',
    },
  })

  // Delivery can only be priced once the shopper says where it is going, which
  // is why this is here and not on the server page that renders this component.
  const zone = form.watch('zone')
  const shipping = getShippingCost(subtotal, zone)
  const total = subtotal + shipping
  // The same function `createOrder` splits the booking with, so the sheet, this
  // summary and the stored order all land on the same two numbers.
  const { advance, due } = splitPayment(total, subtotal, advancePct)

  const method = (form.watch('method') ?? 'bkash') as AdvanceMethod
  const merchantNumber = method === 'bkash' ? bkashNumber : nagadNumber
  const methodLabel = method === 'bkash' ? t.preorder.bkash : t.preorder.nagad

  const name = pick(product.name)
  const color = product.colors?.find((item) => item.name.en === colorEn)

  async function onSubmit(values: BookingValues) {
    setSubmitting(true)

    try {
      const { orderNumber } = await placeOrder({
        name: values.name,
        phone: values.phone,
        address: values.address,
        city: values.city,
        zone: values.zone,
        notes: values.notes || undefined,
        // Ignored server-side for a pre-order, which is always `advance_cod`.
        paymentMethod: 'cod',
        items: [{ productId: product.id, quantity, size, colorEn }],
        advance: needsAdvance
          ? {
              method: values.method ?? 'bkash',
              trxId: values.trxId ?? '',
              senderPhone: values.senderPhone ?? '',
            }
          : undefined,
      })

      router.push(`/checkout/success?order=${orderNumber}`)
    } catch (error) {
      setSubmitting(false)
      // The run selling out between render and submit is the one failure a
      // shopper can act on, so it gets its own message instead of the generic
      // "try again" that hides it.
      const soldOut =
        error instanceof Error && /fully booked/i.test(error.message)
      toast.error(
        soldOut ? t.preorder.soldOutError : t.preorder.genericError,
      )
    }
  }

  const methods: { value: AdvanceMethod; label: string; number: string }[] = [
    { value: 'bkash', label: t.preorder.bkash, number: bkashNumber },
    { value: 'nagad', label: t.preorder.nagad, number: nagadNumber },
  ]

  return (
    <>
      <LoadingOverlay show={submitting} label={t.preorder.confirming} />

      <PageHeader
        title={t.preorder.title}
        description={
          needsAdvance ? t.preorder.subtitle : t.preorder.subtitleCod
        }
        breadcrumb={t.preorder.breadcrumb}
      />

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

              {needsAdvance && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    {t.preorder.payTitle}
                  </h2>

                  <FormField
                    control={form.control}
                    name="method"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>{t.preorder.payVia}</FormLabel>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {methods.map((option) => {
                            const checked = field.value === option.value
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
                                  name="advance-method"
                                  value={option.value}
                                  checked={checked}
                                  onChange={() => field.onChange(option.value)}
                                  className="size-4 accent-primary"
                                />
                                <Smartphone
                                  className={cn(
                                    'size-5',
                                    checked
                                      ? 'text-primary'
                                      : 'text-muted-foreground',
                                  )}
                                />
                                <span className="text-sm font-medium text-foreground">
                                  {option.label}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="rounded-lg border border-border bg-muted/40 p-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t.preorder.merchantNumber}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span className="font-mono text-xl font-bold tracking-wider text-foreground">
                        {merchantNumber}
                      </span>
                      <CopyButton
                        value={merchantNumber}
                        label={t.preorder.copyNumber}
                      />
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                      {t.preorder.paySteps
                        .replace('{method}', methodLabel)
                        .replace('{number}', merchantNumber)
                        .replace('{amount}', price(advance))}
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="trxId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.preorder.trxId}</FormLabel>
                          <FormControl>
                            <Input
                              autoCapitalize="characters"
                              placeholder={t.preorder.trxIdPlaceholder}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {t.preorder.trxIdHint}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="senderPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.preorder.senderPhone}</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              inputMode="tel"
                              placeholder={t.checkout.phonePlaceholder}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {t.preorder.senderPhoneHint}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              <p className="text-xs leading-relaxed text-muted-foreground">
                {needsAdvance
                  ? t.preorder.termsRestated
                  : t.preorder.termsRestatedCod}
              </p>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitting}
              >
                {submitting
                  ? t.preorder.confirming
                  : needsAdvance
                    ? `${t.preorder.confirm} · ${price(advance)}`
                    : t.preorder.confirm}
              </Button>
            </form>
          </Form>
        </div>

        {/* Booking summary */}
        <aside className="lg:col-span-2">
          <div className="rounded-lg border border-border bg-card p-5 lg:sticky lg:top-24">
            <h2 className="text-lg font-semibold text-foreground">
              {t.checkout.orderSummary}
            </h2>

            <div className="mt-4 flex gap-3 border-b border-border pb-4">
              <img
                src={product.image || '/placeholder.svg'}
                alt={name}
                className="size-14 shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium text-foreground">
                  {name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {size && `${t.cart.size}: ${size}`}
                  {size && color && ' • '}
                  {color && pick(color.name)}
                  {' • '}
                  {t.checkout.quantityShort}: {quantity}
                </p>
              </div>
              <p className="text-sm font-semibold whitespace-nowrap text-foreground">
                {price(subtotal)}
              </p>
            </div>

            <p className="mt-3 flex items-center gap-2 text-xs font-medium text-primary">
              <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
              {t.preorder.shipsFrom}{' '}
              {formatShipDate(product.preorderShipsAt, locale)}
            </p>

            <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <dt>{t.checkout.subtotal}</dt>
                <dd>{price(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <dt>{t.checkout.shipping}</dt>
                <dd className={cn(shipping === 0 && 'font-medium text-badge-new')}>
                  {shipping === 0 ? t.checkout.free : price(shipping)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold text-foreground">
                <dt>{t.checkout.total}</dt>
                <dd>{price(total)}</dd>
              </div>
            </dl>

            {/* The split is the whole point of this page when there is one.
                On a cash-on-delivery run there is nothing to split, and a row
                reading "Advance now (0%) — ৳0" would only raise the question
                of whether money is being asked for. */}
            {needsAdvance ? (
              <dl className="mt-4 space-y-2 rounded-lg bg-accent p-4 text-sm">
                <div className="flex justify-between font-semibold text-foreground">
                  <dt>
                    {t.preorder.advanceNowPct.replace(
                      '{pct}',
                      String(advancePct),
                    )}
                  </dt>
                  <dd>{price(advance)}</dd>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <dt>{t.preorder.dueOnDelivery}</dt>
                  <dd>{price(due)}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 rounded-lg bg-accent p-4 text-sm font-medium text-foreground">
                {t.checkout.methods.codHint}
              </p>
            )}
          </div>
        </aside>
      </section>
    </>
  )
}
