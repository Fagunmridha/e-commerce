'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarClock, Minus, Plus, ShieldCheck, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { BrandMark } from '@/components/header/brand-mark'
import { Rating } from '@/components/rating'
import { ProductHelp } from '@/components/product-help'
import { useLanguage } from '@/components/language-provider'
import { ColorSwatch, isSwatchable } from '@/components/color-swatch'
import { DeliveryFields } from '@/components/checkout/delivery-fields'
import { LandingGallery } from '@/components/landing/landing-gallery'
import { LandingSteps, LandingTrust } from '@/components/landing/landing-assurance'
import { LandingReviews } from '@/components/landing/landing-reviews'
import { placeOrder } from '@/app/actions/orders'
import { DEFAULT_ZONE, getShippingCost } from '@/lib/currency'
import type { Product, Review } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  buildDeliverySchema,
  type DeliveryValues,
} from '@/lib/validation/checkout'

const BADGE_STYLES = {
  new: 'bg-badge-new text-badge-new-foreground',
  sale: 'bg-badge-sale text-badge-sale-foreground',
} as const

/** Below this many pieces the buy box says so out loud. */
const LOW_STOCK_AT = 5

export function ProductLanding({
  product,
  images,
  reviews,
  deliveryWindow,
  year,
}: {
  product: Product
  images: string[]
  /** Approved reviews, for the social-proof band. */
  reviews: Review[]
  /** "15 Aug – 18 Aug", formatted on the server to keep hydration stable. */
  deliveryWindow: string
  /** Also read on the server — a client `new Date()` would risk a mismatch. */
  year: number
}) {
  const router = useRouter()
  const { t, pick, price } = useLanguage()
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] ?? '')
  const [selectedColorIndex, setSelectedColorIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const name = pick(product.name)
  const selectedColor = product.colors?.[selectedColorIndex]
  const swatchable = isSwatchable(product.colors)

  // A wholesaler's listing can carry a minimum, and `createOrder` rejects
  // anything under it. Starting at the minimum rather than at 1 keeps that
  // rejection from arriving as a failed submit at the end of the form.
  const moq = Math.max(1, product.moq ?? 1)
  const outOfStock = product.stock < moq
  const maxQuantity = Math.max(moq, product.stock)
  const [quantity, setQuantity] = useState(moq)

  const discountPct =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : 0
  const savings = product.oldPrice
    ? (product.oldPrice - product.price) * quantity
    : 0

  const form = useForm<DeliveryValues>({
    resolver: zodResolver(buildDeliverySchema(t.checkout.errors)),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      city: '',
      zone: DEFAULT_ZONE,
      notes: '',
    },
  })

  // Watched rather than held in local state: the radio lives inside the form,
  // and the summary and the sticky bar both have to move the moment it changes.
  const zone = form.watch('zone')

  // The delivery charge is part of what the rider collects — `createOrder`
  // prices it server-side from the same zone, so quoting the goods alone as
  // "Total" would under-quote every order.
  const subtotal = product.price * quantity
  const shipping = getShippingCost(subtotal, zone)
  const total = subtotal + shipping

  // Single-product order — no cart involved. `placeOrder` recomputes the price
  // server-side, so we only send the chosen product + variant + quantity.
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
        paymentMethod: 'cod',
        items: [
          {
            productId: product.id,
            quantity,
            size: selectedSize || undefined,
            colorEn: selectedColor?.name.en,
          },
        ],
      })

      router.push(`/checkout/success?order=${orderNumber}`)
    } catch {
      setSubmitting(false)
      toast.error(t.landing.orderFailed)
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Minimal top bar — the only route back to the full store. */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 max-w-page items-center justify-between px-4 sm:px-6 lg:px-4">
          <BrandMark href="/" />
          <Link
            href="/shop"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            {t.landing.browseStore}
          </Link>
        </div>
      </header>

      {/* Room for the sticky order bar, which only exists below `lg`. */}
      <div className="pb-28 lg:pb-0">
        <div className="mx-auto max-w-page px-4 py-8 sm:px-6 sm:py-12 lg:px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
            <LandingGallery images={images} name={name} />

            {/* Buy box */}
            <div className="space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {product.badge && (
                    <span
                      className={cn(
                        'inline-block rounded px-2 py-0.5 text-[11px] font-semibold',
                        BADGE_STYLES[product.badge],
                      )}
                    >
                      {t.badges[product.badge]}
                    </span>
                  )}
                  {discountPct > 0 && (
                    <span className="inline-block rounded bg-badge-sale px-2 py-0.5 text-[11px] font-semibold text-badge-sale-foreground">
                      {t.landing.discountOff.replace('{n}', String(discountPct))}
                    </span>
                  )}
                </div>

                <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {name}
                </h1>

                {/* Stars only once there is something behind them: five empty
                    outlines on a brand-new listing read as a bad score. */}
                {product.reviews > 0 && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <Rating
                      value={product.rating}
                      reviews={product.reviews}
                      size="md"
                    />
                    {product.sold !== undefined && product.sold > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {t.product.sold.replace('{n}', String(product.sold))}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="text-3xl font-bold text-foreground">
                    {price(product.price)}
                  </p>
                  {product.oldPrice && (
                    <p className="text-lg text-muted-foreground line-through">
                      {price(product.oldPrice)}
                    </p>
                  )}
                  {savings > 0 && (
                    <p className="text-sm font-semibold text-primary">
                      {t.landing.youSave.replace('{amount}', price(savings))}
                    </p>
                  )}
                </div>

                <p className="mt-1.5 text-sm text-muted-foreground">
                  {t.landing.deliveryLine}
                </p>
              </div>

              {product.description && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {pick(product.description)}
                </p>
              )}

              {product.highlights && product.highlights.length > 0 && (
                <ul className="space-y-2">
                  {product.highlights.map((highlight) => (
                    <li
                      key={highlight.en}
                      className="flex items-start gap-2 text-sm text-foreground"
                    >
                      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                      {pick(highlight)}
                    </li>
                  ))}
                </ul>
              )}

              {product.colors && product.colors.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-sm font-semibold text-foreground">
                    {t.product.color}:{' '}
                    <span className="font-normal">
                      {selectedColor ? pick(selectedColor.name) : ''}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color, index) =>
                      swatchable ? (
                        <ColorSwatch
                          key={color.name.en}
                          hex={color.hex!}
                          label={pick(color.name)}
                          selected={selectedColorIndex === index}
                          onSelect={() => setSelectedColorIndex(index)}
                        />
                      ) : (
                        <button
                          key={color.name.en}
                          type="button"
                          onClick={() => setSelectedColorIndex(index)}
                          className={cn(
                            'rounded-md border px-4 py-2 text-sm font-medium transition-colors',
                            selectedColorIndex === index
                              ? 'border-primary bg-accent text-primary'
                              : 'border-border hover:border-primary',
                          )}
                        >
                          {pick(color.name)}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}

              {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-sm font-semibold text-foreground">
                    {t.product.size}:{' '}
                    <span className="font-normal">{selectedSize}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          'min-w-14 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                          selectedSize === size
                            ? 'border-primary bg-accent text-primary'
                            : 'border-border hover:border-primary',
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2.5">
                <p className="text-sm font-semibold text-foreground">
                  {t.product.quantity}
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex w-fit items-center rounded-md border border-border">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(moq, quantity - 1))}
                      disabled={quantity <= moq}
                      className="p-2.5 transition-colors hover:bg-muted disabled:opacity-35"
                      aria-label={t.cart.decrease}
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-10 text-center text-sm font-medium">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      // Capped at what is actually on the shelf: the server
                      // rejects an oversell, and it should not take a filled-in
                      // form to find that out.
                      onClick={() =>
                        setQuantity(Math.min(maxQuantity, quantity + 1))
                      }
                      disabled={quantity >= maxQuantity}
                      className="p-2.5 transition-colors hover:bg-muted disabled:opacity-35"
                      aria-label={t.cart.increase}
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>

                  {!outOfStock && product.stock <= LOW_STOCK_AT && (
                    <span className="text-sm font-semibold text-badge-sale">
                      {t.product.lowStock.replace('{n}', String(product.stock))}
                    </span>
                  )}
                </div>
              </div>

              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarClock className="size-4 shrink-0 text-primary" />
                {t.landing.estDelivery}: {deliveryWindow}
              </p>

              {/* Inline order form — the whole point of this page. */}
              <div
                id="order-form"
                className="scroll-mt-20 rounded-2xl border border-border bg-card p-5 sm:p-6"
              >
                <h2 className="text-lg font-semibold text-foreground">
                  {t.landing.orderTitle}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t.landing.orderSubtitle}
                </p>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="mt-5 space-y-4"
                  >
                    <DeliveryFields notesRows={2} />

                    <dl className="space-y-2 border-t border-border pt-4 text-sm">
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">
                          {t.checkout.subtotal}
                          <span className="ml-1">
                            ({t.checkout.quantityShort} {quantity})
                          </span>
                        </dt>
                        <dd className="text-foreground">{price(subtotal)}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">
                          {t.checkout.shipping}
                        </dt>
                        <dd
                          className={
                            shipping === 0 ? 'font-medium text-primary' : 'text-foreground'
                          }
                        >
                          {shipping === 0 ? t.checkout.free : price(shipping)}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between border-t border-border pt-2">
                        <dt className="font-semibold text-foreground">
                          {t.checkout.total}
                        </dt>
                        <dd className="text-base font-bold text-foreground">
                          {price(total)}
                        </dd>
                      </div>
                    </dl>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={submitting || outOfStock}
                    >
                      {outOfStock
                        ? t.landing.outOfStock
                        : submitting
                          ? t.landing.placing
                          : t.landing.cta}
                    </Button>
                  </form>
                </Form>

                <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-1.5">
                    <Truck className="size-3.5 text-primary" />
                    {t.checkout.methods.codHint}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-primary" />
                    {outOfStock ? t.product.outOfStock : t.product.inStock}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <LandingSteps />
        <LandingTrust />
        <LandingReviews
          reviews={reviews}
          rating={product.rating}
          reviewCount={product.reviews}
        />
        <ProductHelp />

        <footer className="border-t border-border py-8">
          <div className="mx-auto flex max-w-page flex-col items-center gap-3 px-4 text-center sm:px-6 lg:px-4">
            <BrandMark href="/" />
            <p className="text-xs text-muted-foreground">
              {t.landing.footerNote.replace('{year}', String(year))}
            </p>
          </div>
        </footer>
      </div>

      {/* The form is a long scroll away on a phone, so the price and the way
          back to it stay on screen. Sized to clear the floating WhatsApp
          button, which parks itself 4.5rem off the bottom on small screens.
          Pointer layouts see the buy box beside the photo and need none of it. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">{name}</p>
            <p className="text-lg font-bold text-foreground">{price(total)}</p>
          </div>
          {/* Out of stock renders a real disabled button, not an anchor: a
              `disabled` attribute on an `<a>` is inert, and the link would
              still scroll to a form nothing can be ordered through. */}
          {outOfStock ? (
            <Button size="lg" disabled className="shrink-0">
              {t.landing.outOfStock}
            </Button>
          ) : (
            <Button asChild size="lg" className="shrink-0">
              <a href="#order-form">{t.landing.orderShort}</a>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
