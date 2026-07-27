'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { useStore } from '@/components/store-provider'

export function WishlistButton() {
  const { t } = useLanguage()
  const { hydrated, wishlist } = useStore()

  return (
    <Link
      href="/wishlist"
      className="relative grid size-11 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      aria-label={`${t.wishlist.open}, ${wishlist.length}`}
    >
      <Heart className="size-5" />
      {hydrated && wishlist.length > 0 && (
        <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-badge-sale text-[10px] font-bold text-badge-sale-foreground">
          {wishlist.length}
        </span>
      )}
    </Link>
  )
}
