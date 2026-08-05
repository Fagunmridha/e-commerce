'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, Heart, Minus, Plus, Share2, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Rating } from '@/components/rating'
import { ColorSwatch, isSwatchable } from '@/components/color-swatch'
import { BookingSheet } from '@/components/preorder/booking-sheet'
import { PreorderBanner } from '@/components/preorder/preorder-banner'
import { useLanguage } from '@/components/language-provider'
import { useStore } from '@/components/store-provider'
import { useCatalogue } from '@/components/catalogue-provider'
import { formatShipDate } from '@/lib/preorder'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/types'

const BADGE_STYLES = {
  new: 'bg-badge-new text-badge-new-foreground',
  sale: 'bg-badge-sale text-badge-sale-foreground',
} as const

export function ProductDetail({
  product,
  images,
  deliveryWindow,
}: {
  product: Product
  images: string[]
  /** Pre-formatted on the server — a client `new Date()` here would risk a
   *  hydration mismatch around midnight. */
  deliveryWindow: string
}) {
  const { t, pick, locale, price: formatPrice } = useLanguage()
  const { addToCart, isWishlisted, toggleWishlist } = useStore()
  const { getCategory } = useCatalogue()
  const router = useRouter()

  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] ?? '')
  const [selectedColorIndex, setSelectedColorIndex] = useState(0)
  // Non-null while the booking sheet is open. Only ever set for a pre-order.
  const [booking, setBooking] = useState<Product | null>(null)
  // Wholesale listings are sold in lots, so the picker opens at the minimum
  // rather than at 1 — otherwise the first tap on "−" would appear to do nothing.
  const minQuantity = product.moq ?? 1
  const [quantity, setQuantity] = useState(minQuantity)

  const name = pick(product.name)
  const category = getCategory(product.category)
  const categoryName = category ? pick(category.name) : product.category
  const selectedColor = product.colors?.[selectedColorIndex]
  // `hex!` below is safe only because this is `every(c => c.hex)`. Keep the two
  // together.
  const swatchable = isSwatchable(product.colors)
  const isFavorited = isWishlisted(product.id)

  /**
   * Upcoming stock. Reached only by a direct link — pre-orders are filtered out
   * of every grid — but that link is what an ad or a shared URL points at, and
   * until this branch existed the page offered "Add to Cart" on something that
   * cannot ship, then let checkout reject the order with a raw error.
   */
  const isPreorder = Boolean(product.preorder)
  // For a pre-order this reads "the allocation is exhausted", which is the same
  // shape of fact and wants the same disabled buttons — only the label differs.
  const soldOut = product.stock <= 0
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0

  const line = {
    productId: product.id,
    quantity,
    size: selectedSize || undefined,
    colorEn: selectedColor?.name.en,
  }

  const addToBag = () => {
    addToCart(line)
    toast.success(t.product.added, {
      description: `${name}${selectedSize ? ` · ${t.product.size} ${selectedSize}` : ''} × ${quantity}`,
    })
  }

  // No second order path: this adds to the cart like any other line and hands
  // over to the existing checkout, so coupons and totals keep working.
  const buyNow = () => {
    addToCart(line)
    router.push('/checkout')
  }

  const onToggleWishlist = () => {
    toast.success(toggleWishlist(product.id) ? t.wishlist.added : t.wishlist.removed, {
      description: name,
    })
  }

  const onShare = async () => {
    const url = window.location.href

    // `navigator.share` only exists on secure origins, and mostly on mobile.
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url })
        return
      } catch {
        // A cancelled share sheet rejects — that is not an error worth reporting.
        return
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      toast.success(t.product.linkCopied)
    } catch {
      toast.error(t.product.share)
    }
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
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
            <Image
              src={images[selectedImage] || '/placeholder.svg'}
              alt={`${name} — ${t.product.view} ${selectedImage + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              className="object-cover"
            />
          </div>
          {/* Only a real gallery gets a thumbnail strip. A single-photo product
              used to render a 4-column grid holding one item. */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((image, index) => (
                <button
                  key={image + index}
                  onClick={() => setSelectedImage(index)}
                  aria-label={`${t.product.showView} ${index + 1}`}
                  aria-current={selectedImage === index}
                  className={cn(
                    'relative aspect-square overflow-hidden rounded-lg border-2 transition-colors',
                    selectedImage === index
                      ? 'border-primary'
                      : 'border-transparent hover:border-border',
                  )}
                >
                  <Image
                    src={image || '/placeholder.svg'}
                    alt=""
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buy box */}
        <div className="space-y-6">
          <div>
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
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
                  {discount > 0 && (
                    <span className="inline-block rounded bg-badge-sale px-2 py-0.5 text-[11px] font-semibold text-badge-sale-foreground">
                      {discount}% {t.product.off}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {name}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  {/* The star block is aria-hidden, so the number inside
                      <Rating> is the only accessible form of the score. */}
                  <a
                    href="#reviews"
                    className="flex items-center gap-2 transition-colors hover:text-primary"
                  >
                    <Rating value={product.rating} size="md" />
                    <span>
                      {t.product.reviewsLabel.replace(
                        '{n}',
                        String(product.reviews),
                      )}
                    </span>
                  </a>
                  {product.sold ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>
                        {t.product.sold.replace('{n}', String(product.sold))}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>

              <button
                onClick={onToggleWishlist}
                className={cn(
                  'shrink-0 rounded-lg border p-3 transition-colors',
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

            {isPreorder && (
              <div className="mt-4">
                <PreorderBanner product={product} />
              </div>
            )}
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
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex w-fit items-center rounded-md border border-border">
                <button
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
                {/* Stops at what is actually on the shelf. */}
                <button
                  onClick={() =>
                    setQuantity(Math.min(product.stock, quantity + 1))
                  }
                  disabled={soldOut || quantity >= product.stock}
                  className="p-2.5 transition-colors hover:bg-muted disabled:opacity-40"
                  aria-label={t.cart.increase}
                >
                  <Plus className="size-4" />
                </button>
              </div>
              {!soldOut && product.stock <= 5 && (
                <p className="text-xs font-medium text-badge-sale">
                  {t.product.lowStock.replace('{n}', String(product.stock))}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {/* A pre-order gets one CTA, not three. `addToBag` and `buyNow` are
                unreachable here by design — both end at a checkout that rejects
                pre-ordered lines. */}
            {isPreorder ? (
              <Button
                size="lg"
                className="flex-1"
                onClick={() => setBooking(product)}
                disabled={soldOut}
              >
                {soldOut ? t.home.comingSoldOutCta : t.home.comingBook}
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={addToBag}
                  disabled={soldOut}
                >
                  {soldOut ? t.product.outOfStock : t.product.addToBag}
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="flex-1"
                  onClick={buyNow}
                  disabled={soldOut}
                >
                  {t.product.buyNow}
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="lg"
              className="sm:w-auto"
              onClick={onShare}
            >
              <Share2 className="size-4" />
              <span className="sr-only sm:not-sr-only">{t.product.share}</span>
            </Button>
          </div>

          <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 p-3">
            <Truck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-xs text-muted-foreground">
              {isPreorder ? (
                <>
                  <span className="font-medium text-foreground">
                    {t.preorder.shipsFrom}
                  </span>{' '}
                  {formatShipDate(product.preorderShipsAt, locale)}
                </>
              ) : (
                <>
                  <span className="font-medium text-foreground">
                    {t.product.estimatedDelivery}
                  </span>{' '}
                  {deliveryWindow}
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-16 grid gap-10 border-t border-border pt-10 md:grid-cols-3">
        {product.highlights && product.highlights.length > 0 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              {t.product.highlights}
            </h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {product.highlights.map((item) => (
                <li key={item.en} className="flex items-start gap-2">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  {pick(item)}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            {t.product.care}
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {t.product.careItems.map((item) => (
              <li key={item}>• {item}</li>
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
              {/* Reads the real column. This used to say "In stock" always —
                  and on a pre-order, "In stock" was doubly wrong. */}
              <dd
                className={cn(
                  'font-medium',
                  soldOut ? 'text-muted-foreground' : 'text-badge-new',
                )}
              >
                {soldOut
                  ? isPreorder
                    ? t.home.comingSoldOut
                    : t.product.outOfStock
                  : isPreorder
                    ? t.preorder.availability.replace(
                        '{date}',
                        formatShipDate(product.preorderShipsAt, locale),
                      )
                    : t.product.inStock}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Seeded with the picks already made above, so opening the sheet is a
          confirmation step rather than a second round of choosing. */}
      <BookingSheet
        product={booking}
        onOpenChange={(open) => {
          if (!open) setBooking(null)
        }}
        seed={{
          size: selectedSize || undefined,
          colorEn: selectedColor?.name.en,
          quantity,
        }}
      />
    </div>
  )
}
