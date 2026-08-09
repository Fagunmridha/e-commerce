'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Heart, ShoppingBag, Truck } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Rating } from '@/components/rating'
import { ColorSwatch, isSwatchable } from '@/components/color-swatch'
import { useLanguage } from '@/components/language-provider'
import { useStore } from '@/components/store-provider'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/types'

/**
 * Peek at a product without leaving the grid. Deliberately a subset of the full
 * detail page — size, colour, quantity and add-to-cart — with a link through to
 * the real page for everything else.
 */
export function ProductQuickView({
  product,
  open,
  onOpenChange,
}: {
  product: Product
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t, pick, price: formatPrice } = useLanguage()
  const { addToCart, isWishlisted, toggleWishlist } = useStore()
  const [size, setSize] = useState<string | undefined>(product.sizes?.[0])
  const [colorEn, setColorEn] = useState<string | undefined>(
    product.colors?.[0]?.name.en,
  )

  const label = pick(product.name)
  const swatchable = isSwatchable(product.colors)
  const favorited = isWishlisted(product.id)
  const soldOut = product.stock <= 0
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0

  const onAdd = () => {
    addToCart({ productId: product.id, quantity: 1, size, colorEn })
    toast.success(t.product.added, { description: label })
    onOpenChange(false)
  }

  const chip = (selected: boolean) =>
    cn(
      'rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
      selected
        ? 'border-foreground bg-foreground text-background'
        : 'border-border text-foreground hover:border-foreground',
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-3xl">
        <div className="grid sm:grid-cols-2">
          <div className="relative aspect-4/5 bg-secondary sm:aspect-auto sm:min-h-[26rem]">
            <Image
              src={product.image || '/placeholder.svg'}
              alt={label}
              fill
              sizes="(max-width: 640px) 100vw, 384px"
              className="object-cover"
            />
            {discount > 0 && (
              <span className="absolute top-4 left-4 rounded-full bg-badge-sale px-3 py-1 text-[10px] font-bold tracking-wider text-badge-sale-foreground uppercase">
                -{discount}% {t.card.off}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-5 p-6 sm:p-8">
            <div>
              <DialogTitle className="text-2xl leading-tight font-bold tracking-tight text-balance">
                {label}
              </DialogTitle>
              <Rating
                value={product.rating}
                reviews={product.reviews}
                size="md"
                className="mt-3"
              />
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-extrabold text-foreground">
                {formatPrice(product.price)}
              </span>
              {product.oldPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.oldPrice)}
                </span>
              )}
            </div>

            {product.description && (
              <DialogDescription className="line-clamp-3 text-sm leading-relaxed">
                {pick(product.description)}
              </DialogDescription>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <fieldset>
                <legend className="mb-2.5 text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
                  {t.product.size}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSize(option)}
                      aria-pressed={size === option}
                      className={chip(size === option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {product.colors && product.colors.length > 0 && (
              <fieldset>
                <legend className="mb-2.5 text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
                  {t.product.color}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((option) =>
                    swatchable ? (
                      <ColorSwatch
                        key={option.name.en}
                        hex={option.hex!}
                        label={pick(option.name)}
                        selected={colorEn === option.name.en}
                        onSelect={() => setColorEn(option.name.en)}
                      />
                    ) : (
                      <button
                        key={option.name.en}
                        type="button"
                        onClick={() => setColorEn(option.name.en)}
                        aria-pressed={colorEn === option.name.en}
                        className={chip(colorEn === option.name.en)}
                      >
                        {pick(option.name)}
                      </button>
                    ),
                  )}
                </div>
              </fieldset>
            )}

            <div className="mt-auto flex flex-col gap-3">
              <div className="flex gap-2">
                <Button
                  size="lg"
                  onClick={onAdd}
                  disabled={soldOut}
                  className="h-12 flex-1 gap-2 rounded-xl font-bold tracking-wide uppercase"
                >
                  <ShoppingBag className="size-4" />
                  {soldOut ? t.card.outOfStock : t.product.addToBag}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() =>
                    toast.success(
                      toggleWishlist(product.id)
                        ? t.wishlist.added
                        : t.wishlist.removed,
                      { description: label },
                    )
                  }
                  aria-label={favorited ? t.wishlist.remove : t.product.favorite}
                  aria-pressed={favorited}
                  className="size-12 rounded-xl"
                >
                  <Heart
                    className={cn('size-4', favorited && 'fill-primary text-primary')}
                  />
                </Button>
              </div>

              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Truck className="size-3.5 shrink-0" />
                {t.product.deliveryNote}
              </p>

              <DialogClose asChild>
                <Link
                  href={`/product/${product.id}`}
                  className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-foreground"
                >
                  {t.product.specs}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </DialogClose>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
