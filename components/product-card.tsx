'use client'

import Link from 'next/link'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/data'

const BADGE_STYLES = {
  new: 'bg-badge-new text-badge-new-foreground',
  sale: 'bg-badge-sale text-badge-sale-foreground',
} as const

export function ProductCard({ product }: { product: Product }) {
  const { t, pick, price: formatPrice } = useLanguage()
  const { id, name, price, oldPrice, image, badge } = product
  const label = pick(name)

  return (
    <Link
      href={`/product/${id}`}
      className="group block overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={image || '/placeholder.svg'}
          alt={label}
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {badge && (
          <span
            className={cn(
              'absolute top-3 left-3 rounded px-2 py-0.5 text-[11px] font-semibold',
              BADGE_STYLES[badge],
            )}
          >
            {t.badges[badge]}
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="line-clamp-1 text-sm font-medium text-foreground">{label}</h3>
        <div className="mt-1.5 flex items-baseline gap-2">
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
