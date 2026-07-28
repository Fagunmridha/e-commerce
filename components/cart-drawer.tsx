'use client'

import Link from 'next/link'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useLanguage } from '@/components/language-provider'
import { useStore } from '@/components/store-provider'
import { useCatalogue } from '@/components/catalogue-provider'
import { CouponField } from '@/components/coupon-field'

export function CartDrawer({
  /** Replaces the default header icon — used by the mobile bottom bar. */
  trigger,
}: {
  trigger?: React.ReactNode
} = {}) {
  const { t, pick, price } = useLanguage()
  const { getRecommendedProducts } = useCatalogue()
  const RECOMMENDATIONS = getRecommendedProducts(undefined, 2)
  const {
    hydrated,
    lines,
    itemCount,
    subtotal,
    shipping,
    discount,
    total,
    setQuantity,
    removeLine,
  } = useStore()

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger ?? (
          <button
            className="relative grid size-11 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            aria-label={`${t.cart.open}, ${itemCount} ${t.cart.items}`}
          >
            <ShoppingBag className="size-5" />
            {hydrated && itemCount > 0 && (
              <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-badge-sale text-[10px] font-bold text-badge-sale-foreground">
                {itemCount}
              </span>
            )}
          </button>
        )}
      </SheetTrigger>

      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="text-lg">
            {t.cart.title}
            {itemCount > 0 && ` (${itemCount})`}
          </SheetTitle>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5">
            <ShoppingBag
              className="size-14 text-muted-foreground/40"
              strokeWidth={1.25}
            />
            <p className="text-sm text-muted-foreground">{t.cart.empty}</p>
            <SheetClose asChild>
              <Link href="/shop">
                <Button variant="outline">{t.cart.continueShopping}</Button>
              </Link>
            </SheetClose>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              <ul className="space-y-4">
                {lines.map((line) => {
                  const label = pick(line.product.name)
                  const color = line.product.colors?.find(
                    (item) => item.en === line.colorEn,
                  )

                  return (
                    <li
                      key={line.key}
                      className="flex gap-4 border-b border-border pb-4 last:border-0"
                    >
                      <SheetClose asChild>
                        <Link href={`/product/${line.product.id}`}>
                          <img
                            src={line.product.image || '/placeholder.svg'}
                            alt={label}
                            className="size-20 shrink-0 rounded-md object-cover"
                          />
                        </Link>
                      </SheetClose>
                      <div className="min-w-0 flex-1">
                        <h4 className="line-clamp-1 text-sm font-medium text-foreground">
                          {label}
                        </h4>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {line.size && `${t.cart.size}: ${line.size}`}
                          {line.size && color && ' • '}
                          {color && pick(color)}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {price(line.lineTotal)}
                        </p>

                        <div className="mt-2 flex items-center gap-1">
                          <div className="flex items-center rounded-md border border-border">
                            <button
                              onClick={() =>
                                setQuantity(line.key, line.quantity - 1)
                              }
                              className="p-1.5 transition-colors hover:bg-muted"
                              aria-label={`${t.cart.decrease} ${label}`}
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="w-7 text-center text-xs font-medium">
                              {line.quantity}
                            </span>
                            <button
                              onClick={() =>
                                setQuantity(line.key, line.quantity + 1)
                              }
                              className="p-1.5 transition-colors hover:bg-muted"
                              aria-label={`${t.cart.increase} ${label}`}
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeLine(line.key)}
                            className="ml-auto rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`${t.cart.remove} ${label}`}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  {t.sections.youMayAlsoLike}
                </h3>
                <div className="space-y-2">
                  {RECOMMENDATIONS.map((product) => (
                    <SheetClose asChild key={product.id}>
                      <Link
                        href={`/product/${product.id}`}
                        className="flex items-center gap-3 rounded-md border border-border p-2.5 transition-colors hover:border-primary"
                      >
                        <img
                          src={product.image || '/placeholder.svg'}
                          alt={pick(product.name)}
                          className="size-14 rounded object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-medium text-foreground">
                            {pick(product.name)}
                          </p>
                          <p className="mt-0.5 text-sm font-semibold text-primary">
                            {price(product.price)}
                          </p>
                        </div>
                      </Link>
                    </SheetClose>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-border px-5 py-5">
              {/* Applying here carries through to checkout — both read the
                  same store state. */}
              <CouponField />

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t.cart.subtotal}</span>
                  <span>{price(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between font-medium text-badge-new">
                    <span>{t.cart.discount}</span>
                    <span>−{price(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>{t.cart.shipping}</span>
                  {shipping === 0 ? (
                    <span className="font-medium text-badge-new">{t.cart.free}</span>
                  ) : (
                    <span>{price(shipping)}</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <span>{t.cart.total}</span>
                <span>{price(total)}</span>
              </div>
              <SheetClose asChild>
                <Button asChild className="w-full" size="lg">
                  <Link href="/checkout">{t.cart.checkout}</Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button variant="outline" className="w-full">
                  {t.cart.continueShopping}
                </Button>
              </SheetClose>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
