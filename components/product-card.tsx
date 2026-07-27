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

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product
  /** Set on the first row above the fold so the LCP image is not lazy-loaded. */
  priority?: boolean
}) {
  const { t, pick, price: formatPrice } = useLanguage()
  const { addToCart, isWishlisted, toggleWishlist } = useStore()
  const [quickViewOpen, setQuickViewOpen] = useState(false)

  const { id, name, price, oldPrice, image, images, badge, rating, reviews, stock } =
    product
  const label = pick(name)
  const favorited = isWishlisted(id)
  const soldOut = stock <= 0

  // Second gallery shot, revealed on hover. Falls back to the primary image so
  // the crossfade is a no-op rather than a flash of empty space.
  const hoverImage = images?.find((src) => src && src !== image) ?? image

  const quickAdd = () => {
    addToCart({
      productId: id,
      quantity: 1,
      size: product.sizes?.[0],
      colorEn: product.colors?.[0]?.en,
    })
    toast.success(t.product.added, { description: label })
  }

  const onToggleWishlist = () => {
    toast.success(toggleWishlist(id) ? t.wishlist.added : t.wishlist.removed, {
      description: label,
    })
  }

  const action =
    'flex h-11 items-center justify-center text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:-outline-offset-2 disabled:pointer-events-none disabled:opacity-40'

  return (
    <>
      <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-card-hover">
        <div className="relative aspect-4/3 overflow-hidden bg-secondary">
          <Link
            href={`/product/${id}`}
            // The image is decorative here; the title below is the real link.
            tabIndex={-1}
            aria-hidden="true"
            className="block size-full"
          >
            <Image
              src={image || '/placeholder.svg'}
              alt=""
              fill
              sizes="(max-width: 640px) 70vw, (max-width: 1024px) 45vw, 25vw"
              priority={priority}
              className="object-cover transition-all duration-500 group-hover:scale-105 group-hover:opacity-0"
            />
            <Image
              src={hoverImage || '/placeholder.svg'}
              alt=""
              fill
              sizes="(max-width: 640px) 70vw, (max-width: 1024px) 45vw, 25vw"
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

        <div className="flex flex-1 flex-col p-4">
          <h3 className="text-sm font-semibold text-foreground">
            <Link
              href={`/product/${id}`}
              className="line-clamp-1 transition-colors hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {label}
            </Link>
          </h3>

          <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
            <span className="text-base font-bold text-foreground">
              {formatPrice(price)}
            </span>
            {oldPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(oldPrice)}
              </span>
            )}
          </div>

          <Rating value={rating} reviews={reviews} className="mt-1.5" />
        </div>

        {/* Persistent action row — reachable on touch without a hover state. */}
        <div className="grid grid-cols-3 divide-x divide-border border-t border-border bg-secondary/50">
          <button
            type="button"
            onClick={quickAdd}
            disabled={soldOut}
            aria-label={`${t.card.addToBag}: ${label}`}
            className={action}
          >
            <ShoppingCart className="size-4" />
          </button>
          <button
            type="button"
            onClick={onToggleWishlist}
            aria-label={favorited ? t.wishlist.remove : t.product.favorite}
            aria-pressed={favorited}
            className={action}
          >
            <Heart
              className={cn('size-4', favorited && 'fill-primary text-primary')}
            />
          </button>
          <button
            type="button"
            onClick={() => setQuickViewOpen(true)}
            aria-label={`${t.card.quickView}: ${label}`}
            className={action}
          >
            <Eye className="size-4" />
          </button>
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
