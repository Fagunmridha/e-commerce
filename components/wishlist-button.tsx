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
      className="relative rounded-md p-2 text-foreground transition-colors hover:bg-muted"
      aria-label={`${t.wishlist.open}, ${wishlist.length}`}
    >
      <Heart className="size-5" />
      {hydrated && wishlist.length > 0 && (
        <span className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-badge-sale text-[10px] font-semibold text-badge-sale-foreground">
          {wishlist.length}
        </span>
      )}
    </Link>
  )
}
