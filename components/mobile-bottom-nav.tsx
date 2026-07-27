'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, Home, ShoppingBag, Store, User } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { CartDrawer } from '@/components/cart-drawer'
import { useLanguage } from '@/components/language-provider'
import { useStore } from '@/components/store-provider'
import { cn } from '@/lib/utils'

/**
 * Thumb-reach navigation for phones. Hidden from `lg` up, and suppressed on the
 * distraction-free `/lp` funnels and the admin dashboard.
 */
export function MobileBottomNav() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const { isSignedIn } = useUser()
  const { hydrated, itemCount, wishlist } = useStore()

  if (pathname?.startsWith('/lp') || pathname?.startsWith('/admin')) return null

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const item = (active: boolean) =>
    cn(
      'relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors',
      active ? 'text-primary' : 'text-muted-foreground',
    )

  const badge =
    'absolute top-1.5 right-[22%] flex min-w-4 items-center justify-center rounded-full bg-badge-sale px-1 text-[9px] font-bold text-badge-sale-foreground'

  return (
    <nav
      aria-label={t.mobileNav.label}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/90 lg:hidden"
    >
      <ul className="flex items-stretch">
        <li className="flex flex-1">
          <Link href="/" className={item(isActive('/'))}>
            <Home className="size-5" aria-hidden="true" />
            {t.mobileNav.home}
          </Link>
        </li>
        <li className="flex flex-1">
          <Link href="/shop" className={item(isActive('/shop'))}>
            <Store className="size-5" aria-hidden="true" />
            {t.mobileNav.shop}
          </Link>
        </li>
        <li className="flex flex-1">
          <Link href="/wishlist" className={item(isActive('/wishlist'))}>
            <Heart className="size-5" aria-hidden="true" />
            {hydrated && wishlist.length > 0 && (
              <span className={badge}>{wishlist.length}</span>
            )}
            {t.mobileNav.wishlist}
          </Link>
        </li>
        <li className="flex flex-1">
          <CartDrawer
            trigger={
              <button
                type="button"
                className={item(false)}
                aria-label={`${t.cart.open}, ${itemCount} ${t.cart.items}`}
              >
                <ShoppingBag className="size-5" aria-hidden="true" />
                {hydrated && itemCount > 0 && (
                  <span className={badge}>{itemCount}</span>
                )}
                {t.mobileNav.cart}
              </button>
            }
          />
        </li>
        <li className="flex flex-1">
          <Link
            href={isSignedIn ? '/account' : '/sign-in'}
            className={item(isActive('/account'))}
          >
            <User className="size-5" aria-hidden="true" />
            {t.mobileNav.account}
          </Link>
        </li>
      </ul>
    </nav>
  )
}
