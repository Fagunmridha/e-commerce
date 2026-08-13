'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, Heart, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { Rating } from '@/components/rating'
import { ProductQuickView } from '@/components/product-quick-view'
import { useLanguage } from '@/components/language-provider'
import { useStore } from '@/components/store-provider'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/types'

const BADGE_STYLES = {
  new: 'bg-badge-new text-badge-new-foreground',
  sale: 'bg-badge-sale text-badge-sale-foreground',
} as const

export function ProductListCard({
  product,
  priority = false,
}: {
  product: Product
  priority?: boolean
}) {
  const { t, pick, price: formatPrice } = useLanguage()
  const { addToCart, isWishlisted, toggleWishlist } = useStore()
  const [quickViewOpen, setQuickViewOpen] = useState(false)

  const { id, name, price, oldPrice, image, images, badge, rating, reviews, stock, moq, highlights } =
    product
  const label = pick(name)
  const favorited = isWishlisted(id)
  const soldOut = stock <= 0

  const hoverImage = images?.find((src) => src && src !== image) ?? image

  const quickAdd = () => {
    addToCart({
      productId: id,
      quantity: 1,
      size: product.sizes?.[0],
      colorEn: product.colors?.[0]?.name.en,
    })
    toast.success(t.product.added, { description: label })
  }

  const onToggleWishlist = () => {
    toast.success(toggleWishlist(id) ? t.wishlist.added : t.wishlist.removed, {
      description: label,
    })
  }

  return (
    <>
      <article className="group flex flex-col sm:flex-row overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-foreground/30 hover:shadow-card-hover">
        <div className="relative aspect-4/3 w-full sm:w-56 sm:shrink-0 overflow-hidden bg-secondary">
          <Link
            href={`/product/${id}`}
            tabIndex={-1}
            aria-hidden="true"
            className="block size-full"
          >
            <Image
              src={image || '/placeholder.svg'}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 224px"
              priority={priority}
              className="object-cover transition-all duration-500 group-hover:scale-105 group-hover:opacity-0"
            />
            <Image
              src={hoverImage || '/placeholder.svg'}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 224px"
              loading="lazy"
              className="scale-105 object-cover opacity-0 transition-all duration-500 group-hover:opacity-100"
            />
          </Link>

          <div className="pointer-events-none absolute top-3 left-3 flex flex-col items-start gap-1.5">
            {badge && (
              <span
                className={cn(
                  'rounded-md px-2.5 py-1 text-[11px] font-bold',
                  BADGE_STYLES[badge],
                )}
              >
                {t.badges[badge]}
              </span>
            )}
            {soldOut && (
              <span className="rounded-md bg-background px-2.5 py-1 text-[11px] font-bold text-muted-foreground shadow-card">
                {t.card.outOfStock}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-foreground sm:text-lg">
                  <Link
                    href={`/product/${id}`}
                    className="transition-colors hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    {label}
                  </Link>
                </h3>
                <Rating value={rating} reviews={reviews} className="mt-1" />
              </div>

              <div className="flex flex-col items-end">
                <span className="text-lg font-extrabold text-foreground sm:text-xl">
                  {formatPrice(price)}
                </span>
                {oldPrice && (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrice(oldPrice)}
                  </span>
                )}
              </div>
            </div>

            {highlights && highlights.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {highlights.map((h, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-secondary/80 px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {pick(h)}
                  </span>
                ))}
              </div>
            )}

            {moq && moq > 1 && (
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                {t.wholesale.moq.badge.replace('{n}', String(moq))}
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={quickAdd}
              disabled={soldOut}
              aria-label={`${t.card.addToBag}: ${label}`}
              className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-40"
            >
              <ShoppingCart className="size-4" />
              <span>{t.card.addToBag}</span>
            </button>

            <button
              type="button"
              onClick={onToggleWishlist}
              aria-label={favorited ? t.wishlist.remove : t.product.favorite}
              aria-pressed={favorited}
              className="flex size-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <Heart
                className={cn('size-4', favorited && 'fill-primary text-primary')}
              />
            </button>

            <button
              type="button"
              onClick={() => setQuickViewOpen(true)}
              aria-label={`${t.card.quickView}: ${label}`}
              className="flex size-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <Eye className="size-4" />
            </button>
          </div>
        </div>
      </article>

      <ProductQuickView
        product={product}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
      />
    </>
  )
}
