'use client'

import Link from 'next/link'
import { Heart, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { Rating } from '@/components/rating'
import { useLanguage } from '@/components/language-provider'
import { useStore } from '@/components/store-provider'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/types'

const BADGE_STYLES = {
  new: 'bg-badge-new text-badge-new-foreground',
  sale: 'bg-badge-sale text-badge-sale-foreground',
} as const

export function ProductCard({ product }: { product: Product }) {
  const { t, pick, price: formatPrice } = useLanguage()
  const { addToCart, isWishlisted, toggleWishlist } = useStore()

  const { id, name, price, oldPrice, image, badge, rating, reviews } = product
  const label = pick(name)
  const favorited = isWishlisted(id)
  const discount = oldPrice
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : 0

  const quickAdd = (event: React.MouseEvent) => {
    event.preventDefault()
    addToCart({
      productId: id,
      quantity: 1,
      size: product.sizes?.[0],
      colorEn: product.colors?.[0]?.en,
    })
    toast.success(t.product.added, { description: label })
  }

  const onToggleWishlist = (event: React.MouseEvent) => {
    event.preventDefault()
    toast.success(toggleWishlist(id) ? t.wishlist.added : t.wishlist.removed, {
      description: label,
    })
  }

  return (
    <Link
      href={`/product/${id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-foreground/15 hover:shadow-[0_18px_40px_-20px_rgb(0_0_0/0.35)]"
    >
      <div className="relative aspect-4/5 overflow-hidden bg-muted">
        <img
          src={image || '/placeholder.svg'}
          alt={label}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.07]"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {badge && (
            <span
              className={cn(
                'rounded px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase',
                BADGE_STYLES[badge],
              )}
            >
              {t.badges[badge]}
            </span>
          )}
          {discount > 0 && (
            <span className="rounded bg-foreground px-2 py-0.5 text-[11px] font-bold tracking-wide text-background uppercase">
              -{discount}% {t.card.off}
            </span>
          )}
        </div>

        {/* Wishlist — always reachable on touch, fades in on pointer devices. */}
        <button
          onClick={onToggleWishlist}
          aria-label={favorited ? t.wishlist.remove : t.product.favorite}
          aria-pressed={favorited}
          className={cn(
            'absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition-all hover:bg-background',
            favorited
              ? 'opacity-100'
              : 'opacity-100 md:opacity-0 md:group-hover:opacity-100',
          )}
        >
          <Heart className={cn('size-4', favorited && 'fill-primary text-primary')} />
        </button>

        {/* Quick add slides up on hover; on touch it simply sits at the bottom. */}
        <button
          onClick={quickAdd}
          className="absolute inset-x-3 bottom-3 flex items-center justify-center gap-2 rounded-lg bg-foreground py-2.5 text-xs font-bold tracking-wide text-background uppercase transition-all duration-300 hover:bg-primary md:translate-y-[130%] md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
        >
          <ShoppingBag className="size-4" />
          {t.card.addToBag}
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
          {label}
        </h3>
        <Rating value={rating} reviews={reviews} className="mt-1.5" />
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-bold text-foreground">
            {formatPrice(price)}
          </span>
          {oldPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(oldPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
