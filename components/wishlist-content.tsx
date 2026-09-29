'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { ProductCard } from '@/components/product-card'
import { useLanguage } from '@/components/language-provider'
import { useStore } from '@/components/store-provider'

/**
 * `embedded` is for the account area, which already has its own shell and
 * heading: it drops the page header and the page-width padding, and keeps the
 * grid to two columns because the sidebar has taken the room for a third.
 */
export function WishlistContent({ embedded = false }: { embedded?: boolean }) {
  const { t } = useLanguage()
  const { hydrated, wishlist } = useStore()

  return (
    <>
      {embedded ? (
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
          {t.pages.wishlist.title}
        </h1>
      ) : (
        <PageHeader pageKey="wishlist" />
      )}

      <section
        className={
          embedded ? undefined : 'mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-4'
        }
      >
        {!hydrated ? null : wishlist.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <Heart className="size-14 text-muted-foreground/40" strokeWidth={1.25} />
            <div>
              <p className="font-medium text-foreground">{t.wishlist.empty}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.wishlist.emptyHint}
              </p>
            </div>
            <Button asChild>
              <Link href="/shop">{t.wishlist.emptyCta}</Link>
            </Button>
          </div>
        ) : (
          <ul
            className={`grid grid-cols-2 gap-4 ${embedded ? '' : 'sm:grid-cols-3 lg:grid-cols-4'}`}
          >
            {wishlist.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} actions="button" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
