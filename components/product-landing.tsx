'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Minus, Plus, ShieldCheck, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useLanguage } from '@/components/language-provider'
import { placeOrder } from '@/app/actions/orders'
import type { Dictionary } from '@/lib/dictionaries'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Bangladeshi mobile: 11 digits starting 013–019, optional +88 prefix. */
const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/

function buildSchema(errors: Dictionary['checkout']['errors']) {
  return z.object({
    name: z.string().min(2, errors.name),
    phone: z.string().regex(BD_PHONE, errors.phone),
    address: z.string().min(5, errors.address),
    city: z.string().min(2, errors.city),
    notes: z.string().optional(),
  })
}

type LandingValues = z.infer<ReturnType<typeof buildSchema>>

const BADGE_STYLES = {
  new: 'bg-badge-new text-badge-new-foreground',
  sale: 'bg-badge-sale text-badge-sale-foreground',
} as const

export function ProductLanding({
  product,
  images,
}: {
  product: Product
  images: string[]
}) {
  const router = useRouter()
  const { t, pick, price } = useLanguage()
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] ?? '')
  const [selectedColorIndex, setSelectedColorIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const name = pick(product.name)
  const selectedColor = product.colors?.[selectedColorIndex]
  const outOfStock = product.stock <= 0

  const form = useForm<LandingValues>({
    resolver: zodResolver(buildSchema(t.checkout.errors)),
    defaultValues: { name: '', phone: '', address: '', city: '', notes: '' },
  })

  // Single-product order — no cart involved. `placeOrder` recomputes the price
  // server-side, so we only send the chosen product + variant + quantity.
  async function onSubmit(values: LandingValues) {
    setSubmitting(true)

    try {
      const { orderNumber } = await placeOrder({
        name: values.name,
        phone: values.phone,
        address: values.address,
        city: values.city,
        notes: values.notes || undefined,
        paymentMethod: 'cod',
        items: [
          {
            productId: product.id,
            quantity,
            size: selectedSize || undefined,
            colorEn: selectedColor?.en,
          },
        ],
      })

      router.push(`/checkout/success?order=${orderNumber}`)
    } catch {
      setSubmitting(false)
      toast.error(t.checkout.placeOrder)
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Minimal top bar — the only route back to the full store. */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-page items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link href="/" className="text-lg font-bold tracking-tight text-foreground">
            CP Market
          </Link>
          <Link
            href="/shop"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            {t.landing.browseStore}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-page px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
        <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="aspect-square overflow-hidden rounded-xl bg-muted">
              <img
                src={images[selectedImage] || '/placeholder.svg'}
                alt={`${name} — ${selectedImage + 1}`}
                className="size-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <button
                    key={image + index}
                    type="button"
                    onClick={() => setSelectedImage(index)}
                    aria-current={selectedImage === index}
                    className={cn(
                      'aspect-square overflow-hidden rounded-lg border-2 transition-colors',
                      selectedImage === index
                        ? 'border-primary'
                        : 'border-transparent hover:border-border',
                    )}
                  >
                    <img
                      src={image || '/placeholder.svg'}
                      alt=""
                      className="size-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details + order form */}
          <div className="space-y-6">
            <div>
              {product.badge && (
                <span
                  className={cn(
                    'mb-2 inline-block rounded px-2 py-0.5 text-[11px] font-semibold',
                    BADGE_STYLES[product.badge],
                  )}
                >
                  {t.badges[product.badge]}
                </span>
              )}
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {name}
              </h1>
              <div className="mt-3 flex items-baseline gap-3">
                <p className="text-2xl font-bold text-foreground">
                  {price(product.price)}
                </p>
                {product.oldPrice && (
                  <p className="text-lg text-muted-foreground line-through">
                    {price(product.oldPrice)}
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

            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-sm font-semibold text-foreground">
                  {t.product.color}:{' '}
                  <span className="font-normal">
                    {selectedColor ? pick(selectedColor) : ''}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color, index) => (
                    <button
                      key={color.en}
                      type="button"
                      onClick={() => setSelectedColorIndex(index)}
                      className={cn(
                        'rounded-md border px-4 py-2 text-sm font-medium transition-colors',
                        selectedColorIndex === index
                          ? 'border-primary bg-accent text-primary'
                          : 'border-border hover:border-primary',
                      )}
                    >
                      {pick(color)}
                    </button>
                  ))}
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
              <div className="flex w-fit items-center rounded-md border border-border">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2.5 transition-colors hover:bg-muted"
                  aria-label={t.cart.decrease}
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-10 text-center text-sm font-medium">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2.5 transition-colors hover:bg-muted"
                  aria-label={t.cart.increase}
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            {/* Inline order form — the whole point of this page. */}
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
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
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.checkout.fullName}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t.checkout.fullNamePlaceholder}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.checkout.phone}</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            inputMode="tel"
                            placeholder={t.checkout.phonePlaceholder}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.checkout.address}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t.checkout.addressPlaceholder}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.checkout.city}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t.checkout.cityPlaceholder}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.checkout.notes}</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={2}
                            placeholder={t.checkout.notesPlaceholder}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between border-t border-border pt-4 text-sm">
                    <span className="text-muted-foreground">
                      {t.checkout.total}
                    </span>
                    <span className="text-base font-semibold text-foreground">
                      {price(product.price * quantity)}
                    </span>
                  </div>

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
                  {t.product.inStock}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
