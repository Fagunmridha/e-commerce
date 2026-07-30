'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronRight,
  Headphones,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  Share2,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Rating } from '@/components/rating'
import { useLanguage } from '@/components/language-provider'
import { useStore } from '@/components/store-provider'
import { useCatalogue } from '@/components/catalogue-provider'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/types'

const BADGE_STYLES = {
  new: 'bg-badge-new text-badge-new-foreground',
  sale: 'bg-badge-sale text-badge-sale-foreground',
} as const

export function ProductDetail({
  product,
  images,
}: {
  product: Product
  images: string[]
}) {
  const { t, pick, price: formatPrice } = useLanguage()
  const { addToCart, isWishlisted, toggleWishlist } = useStore()
  const { getCategory } = useCatalogue()
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] ?? '')
  const [selectedColorIndex, setSelectedColorIndex] = useState(0)
  // Wholesale listings are sold in lots, so the picker opens at the minimum
  // rather than at 1 — otherwise the first tap on "−" would appear to do nothing.
  const minQuantity = product.moq ?? 1
  const [quantity, setQuantity] = useState(minQuantity)

  const name = pick(product.name)
  const category = getCategory(product.category)
  const categoryName = category ? pick(category.name) : product.category
  const selectedColor = product.colors?.[selectedColorIndex]
  const isFavorited = isWishlisted(product.id)

  const addToBag = () => {
    addToCart({
      productId: product.id,
      quantity,
      size: selectedSize || undefined,
      colorEn: selectedColor?.en,
    })

    toast.success(t.product.added, {
      description: `${name}${selectedSize ? ` · ${t.product.size} ${selectedSize}` : ''} × ${quantity}`,
    })
  }

  const onToggleWishlist = () => {
    toast.success(toggleWishlist(product.id) ? t.wishlist.added : t.wishlist.removed, {
      description: name,
    })
  }

  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:px-6 sm:py-12 lg:px-4">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-1 text-xs text-muted-foreground"
      >
        <Link href="/" className="transition-colors hover:text-primary">
          {t.common.home}
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href={`/${product.category}`}
          className="transition-colors hover:text-primary"
        >
          {categoryName}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="line-clamp-1 text-foreground">{name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-xl bg-muted">
            <img
              src={images[selectedImage] || '/placeholder.svg'}
              alt={`${name} — ${t.product.view} ${selectedImage + 1}`}
              className="size-full object-cover"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {images.map((image, index) => (
              <button
                key={image + index}
                onClick={() => setSelectedImage(index)}
                aria-label={`${t.product.showView} ${index + 1}`}
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
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <div className="mb-3 flex items-start justify-between gap-4">
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
                <Rating
                  value={product.rating}
                  reviews={product.reviews}
                  size="md"
                  className="mt-2"
                />
              </div>
              <button
                onClick={onToggleWishlist}
                className={cn(
                  'rounded-lg border p-3 transition-colors',
                  isFavorited
                    ? 'border-primary bg-accent text-primary'
                    : 'border-border text-muted-foreground hover:border-primary',
                )}
                aria-label={isFavorited ? t.wishlist.remove : t.product.favorite}
                aria-pressed={isFavorited}
              >
                <Heart className={cn('size-5', isFavorited && 'fill-current')} />
              </button>
            </div>

            <div className="flex items-baseline gap-3">
              <p className="text-2xl font-bold text-foreground">
                {formatPrice(product.price)}
              </p>
              {product.oldPrice && (
                <p className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.oldPrice)}
                </p>
              )}
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t.product.freeShippingNote}
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
                {t.product.size}: <span className="font-normal">{selectedSize}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
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
            {minQuantity > 1 && (
              <p className="text-xs text-muted-foreground">
                {t.wholesale.moq.hint.replace('{n}', String(minQuantity))}
              </p>
            )}
            <div className="flex w-fit items-center rounded-md border border-border">
              <button
                onClick={() =>
                  setQuantity(Math.max(minQuantity, quantity - 1))
                }
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
                onClick={() => setQuantity(quantity + 1)}
                className="p-2.5 transition-colors hover:bg-muted"
                aria-label={t.cart.increase}
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button size="lg" className="flex-1" onClick={addToBag}>
              {t.product.addToBag}
            </Button>
            <Button variant="outline" size="lg" className="sm:w-auto">
              <Share2 className="size-4" />
              {t.product.share}
            </Button>
          </div>

          {/* Trust strip — the same four promises as the site-wide feature bar. */}
          <ul className="grid grid-cols-2 gap-3 border-t border-border pt-6">
            {t.features.map((feature, index) => {
              const Icon = [Truck, RotateCcw, ShieldCheck, Headphones][index]

              return (
                <li key={feature.title} className="flex items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {feature.title}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <div className="mt-16 grid gap-10 border-t border-border pt-10 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            {t.product.care}
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {t.product.careItems.map((line) => (
              <li key={line}>• {line}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            {t.product.specs}
          </h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">{t.product.specCategory}</dt>
              <dd className="font-medium text-foreground">{categoryName}</dd>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">{t.product.specSku}</dt>
              <dd className="font-medium text-foreground">
                CP-{product.id.padStart(4, '0')}
              </dd>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">
                {t.product.specAvailability}
              </dt>
              <dd className="font-medium text-badge-new">{t.product.inStock}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
