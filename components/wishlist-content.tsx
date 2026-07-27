'use client'

import Link from 'next/link'
import { Heart, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { useLanguage } from '@/components/language-provider'
import { useStore } from '@/components/store-provider'

export function WishlistContent() {
  const { t, pick, price } = useLanguage()
  const { hydrated, wishlist, addToCart, toggleWishlist } = useStore()

  return (
    <>
      <PageHeader pageKey="wishlist" />

      <section className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-4">
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
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wishlist.map((product) => {
              const name = pick(product.name)

              return (
                <li
                  key={product.id}
                  className="flex gap-4 rounded-lg border border-border bg-card p-4"
                >
                  <Link href={`/product/${product.id}`} className="shrink-0">
                    <img
                      src={product.image || '/placeholder.svg'}
                      alt={name}
                      loading="lazy"
                      className="size-24 rounded-md object-cover"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/product/${product.id}`}
                      className="line-clamp-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
                    >
                      {name}
                    </Link>
                    <p className="mt-1 text-base font-bold text-foreground">
                      {price(product.price)}
                    </p>

                    <div className="mt-auto flex items-center gap-2 pt-3">
                      <Button
                        size="sm"
                        onClick={() => {
                          addToCart({
                            productId: product.id,
                            quantity: 1,
                            size: product.sizes?.[0],
                            colorEn: product.colors?.[0]?.en,
                          })
                          toast.success(t.product.added, { description: name })
                        }}
                      >
                        {t.wishlist.moveToBag}
                      </Button>
                      <button
                        onClick={() => {
                          toggleWishlist(product.id)
                          toast.success(t.wishlist.removed, { description: name })
                        }}
                        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`${t.wishlist.remove} — ${name}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </>
  )
}
