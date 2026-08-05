'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Minus, PackageCheck, Plus, Users } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ColorSwatch, isSwatchable } from '@/components/color-swatch'
import { useLanguage } from '@/components/language-provider'
import { advancePct, formatShipDate, splitPayment } from '@/lib/preorder'
import { getShippingCost } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/types'

export type BookingSeed = {
  size?: string
  colorEn?: string
  quantity?: number
}

/**
 * The pre-order booking sheet.
 *
 * Booking used to be a single silent `addToCart` — quantity 1, first size,
 * first colour, and a dialog offering to empty the shopper's basket because a
 * pre-order may not share an order with shelf stock. This replaces all of that:
 * the shopper sees what they are committing to, picks it properly, and goes
 * straight to a checkout that never touches the cart, so the conflict that
 * dialog existed to resolve cannot arise.
 *
 * Controlled by `product` rather than wrapping a trigger, so the rail can drive
 * one shared instance from the card it was opened from.
 */
export function BookingSheet({
  product,
  onOpenChange,
  seed,
}: {
  product: Product | null
  onOpenChange: (open: boolean) => void
  seed?: BookingSeed
}) {
  const router = useRouter()
  const { t, pick, locale, price } = useLanguage()

  const [size, setSize] = useState<string | undefined>()
  const [colorIndex, setColorIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [agreed, setAgreed] = useState(false)
  /**
   * The product survives `product` going null so the sheet has something to
   * render while it slides away. Without it the close animation is replaced by
   * the panel blinking out of existence.
   */
  const [shown, setShown] = useState<Product | null>(null)

  // Re-seed whenever a different product opens the sheet. The detail page hands
  // over the picks already made on the page, so the shopper is not asked to
  // choose a size twice.
  useEffect(() => {
    if (!product) return
    const colors = product.colors ?? []
    const seededColor = seed?.colorEn
      ? colors.findIndex((color) => color.name.en === seed.colorEn)
      : -1

    setShown(product)
    setSize(seed?.size ?? product.sizes?.[0])
    setColorIndex(seededColor >= 0 ? seededColor : 0)
    setQuantity(Math.max(product.moq ?? 1, seed?.quantity ?? product.moq ?? 1))
    setAgreed(false)
  }, [product, seed?.size, seed?.colorEn, seed?.quantity])

  if (!shown) return null

  const name = pick(shown.name)
  const remaining = shown.stock
  const minQuantity = shown.moq ?? 1
  const booked = shown.preorderBooked ?? 0
  const colors = shown.colors ?? []
  const selectedColor = colors[colorIndex]
  const swatchable = isSwatchable(shown.colors)

  const goods = shown.price * quantity
  const pct = advancePct(shown)
  // The same three functions the checkout page and `createOrder` use, so the
  // number quoted here is the number that ends up on the order.
  const { advance, due } = splitPayment(goods + getShippingCost(goods), goods, pct)

  const confirm = () => {
    const params = new URLSearchParams({ p: shown.id, q: String(quantity) })
    if (size) params.set('size', size)
    if (selectedColor) params.set('color', selectedColor.name.en)
    router.push(`/preorder/checkout?${params.toString()}`)
  }

  return (
    <Sheet open={product !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90dvh] overflow-y-auto rounded-t-2xl sm:mx-auto sm:max-w-lg sm:rounded-b-2xl"
      >
        <SheetHeader>
          <SheetTitle>{t.preorder.sheetTitle}</SheetTitle>
          <SheetDescription>{t.preorder.sheetSubtitle}</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-6">
          <div className="flex gap-3">
            <img
              src={shown.image || '/placeholder.svg'}
              alt={name}
              className="size-16 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <span className="inline-block rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                {t.home.comingBadge}
              </span>
              <p className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">
                {name}
              </p>
              <p className="text-sm font-bold text-foreground">
                {price(shown.price)}
              </p>
            </div>
          </div>

          <dl className="space-y-1.5 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
              <dt className="sr-only">{t.preorder.shipsFrom}</dt>
              <dd className="text-foreground">
                {t.preorder.shipsFrom}{' '}
                <span className="font-semibold">
                  {formatShipDate(shown.preorderShipsAt, locale)}
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
              <dd>{t.home.comingLimited.replace('{count}', String(remaining))}</dd>
            </div>
          </dl>

          {colors.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                {t.product.color}:{' '}
                <span className="font-normal">
                  {selectedColor ? pick(selectedColor.name) : ''}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {colors.map((color, index) =>
                  swatchable ? (
                    <ColorSwatch
                      key={color.name.en}
                      hex={color.hex!}
                      label={pick(color.name)}
                      selected={colorIndex === index}
                      onSelect={() => setColorIndex(index)}
                    />
                  ) : (
                    <button
                      key={color.name.en}
                      type="button"
                      onClick={() => setColorIndex(index)}
                      className={cn(
                        'rounded-md border px-4 py-2 text-sm font-medium transition-colors',
                        colorIndex === index
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

          {shown.sizes && shown.sizes.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                {t.product.size}: <span className="font-normal">{size}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {shown.sizes.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSize(option)}
                    className={cn(
                      'min-w-14 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                      size === option
                        ? 'border-primary bg-accent text-primary'
                        : 'border-border hover:border-primary',
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              {t.product.quantity}
            </p>
            {minQuantity > 1 && (
              <p className="text-xs text-muted-foreground">
                {t.wholesale.moq.hint.replace('{n}', String(minQuantity))}
              </p>
            )}
            {/* Clamped to what is left of the run. The atomic reservation in
                `createOrder` is the real gate; this just stops the shopper
                asking for pieces that are visibly not there. */}
            <div className="flex w-fit items-center rounded-md border border-border">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(minQuantity, quantity - 1))}
                disabled={quantity <= minQuantity}
                className="p-2.5 transition-colors hover:bg-muted disabled:opacity-40"
                aria-label={t.cart.decrease}
              >
                <Minus className="size-4" />
              </button>
              <span className="w-10 text-center text-sm font-medium">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(remaining, quantity + 1))}
                disabled={quantity >= remaining}
                className="p-2.5 transition-colors hover:bg-muted disabled:opacity-40"
                aria-label={t.cart.increase}
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          <dl className="space-y-2 rounded-lg border border-border p-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <dt>{t.preorder.goodsSubtotal}</dt>
              <dd>{price(goods)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-semibold text-foreground">
              <dt>{t.preorder.advanceNowPct.replace('{pct}', String(pct))}</dt>
              <dd>{price(advance)}</dd>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <dt>{t.preorder.dueOnDelivery}</dt>
              <dd>{price(due)}</dd>
            </div>
          </dl>

          {advance > 0 ? (
            <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-muted-foreground">
              <Checkbox
                checked={agreed}
                onCheckedChange={(value) => setAgreed(value === true)}
                className="mt-0.5"
              />
              <span>{t.preorder.terms.replace('{amount}', price(advance))}</span>
            </label>
          ) : (
            <p className="text-xs text-muted-foreground">{t.preorder.noAdvance}</p>
          )}

          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={(advance > 0 && !agreed) || remaining <= 0}
            onClick={confirm}
          >
            {t.preorder.continueCta}
            {advance > 0 ? ` · ${price(advance)}` : ''}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
