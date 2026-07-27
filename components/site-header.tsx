'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, User } from 'lucide-react'
import { UserButton, useUser } from '@clerk/nextjs'
import { Container } from '@/components/layout/container'
import { AnnouncementBar } from '@/components/header/announcement-bar'
import { BrandMark } from '@/components/header/brand-mark'
import { MegaMenu } from '@/components/header/mega-menu'
import { MobileMenu } from '@/components/header/mobile-menu'
import { SearchPanel } from '@/components/header/search-panel'
import { useScrolled } from '@/components/header/use-scrolled'
import { CartDrawer } from '@/components/cart-drawer'
import { WishlistButton } from '@/components/wishlist-button'
import { useLanguage } from '@/components/language-provider'
import type { Dictionary } from '@/lib/dictionaries'
import { cn } from '@/lib/utils'

const NAV_LINKS: { key: keyof Dictionary['nav']; href: string }[] = [
  { key: 'home', href: '/' },
  { key: 'shop', href: '/shop' },
  { key: 'men', href: '/men' },
  { key: 'women', href: '/women' },
  { key: 'kids', href: '/kids' },
  { key: 'about', href: '/about' },
  { key: 'contact', href: '/contact' },
]

/** Shop gets its own mega-menu trigger, so it is skipped in the flat list. */
const FLAT_LINKS = NAV_LINKS.filter((link) => link.href !== '/shop')

export function SiteHeader() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const { isSignedIn } = useUser()
  const scrolled = useScrolled()
  const [searchOpen, setSearchOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const iconButton =
    'relative grid size-11 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none'

  return (
    <header
      className={cn(
        'sticky top-0 z-50 bg-background/95 backdrop-blur transition-shadow duration-300 supports-[backdrop-filter]:bg-background/85',
        scrolled ? 'shadow-card-hover' : 'border-b border-border',
      )}
    >
      {/* The strip folds away on scroll so the sticky header stays compact. */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          scrolled ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100',
        )}
        // Keep the collapsed strip out of the tab order and the a11y tree.
        inert={scrolled}
      >
        <AnnouncementBar />
      </div>

      <Container>
        <div
          className={cn(
            'flex items-center justify-between gap-3 transition-all duration-300',
            scrolled ? 'h-16' : 'h-16 lg:h-20',
          )}
        >
          <div className="flex items-center gap-1">
            <MobileMenu links={NAV_LINKS} isActive={isActive} />
            <BrandMark />
          </div>

          <nav aria-label={t.nav.home} className="hidden lg:block">
            <ul className="flex items-center gap-0.5">
              <li>
                <Link
                  href="/"
                  className={cn(
                    'rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-primary',
                    isActive('/') ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {t.nav.home}
                </Link>
              </li>
              <li>
                <MegaMenu active={isActive('/shop')} />
              </li>
              {FLAT_LINKS.filter((link) => link.href !== '/').map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      'rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-primary',
                      isActive(link.href) ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {t.nav[link.key]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              aria-label={t.header.searchLabel}
              aria-expanded={searchOpen}
              className={iconButton}
            >
              <Search className="size-5" />
            </button>

            <WishlistButton />

            {isSignedIn ? (
              <>
                <Link
                  href="/account"
                  className={cn(iconButton, 'hidden sm:grid')}
                  aria-label={t.header.account}
                >
                  <User className="size-5" />
                </Link>
                <div className="ml-1 hidden items-center sm:flex">
                  <UserButton />
                </div>
              </>
            ) : (
              <Link
                href="/sign-in"
                className={cn(iconButton, 'hidden sm:grid')}
                aria-label={t.header.account}
              >
                <User className="size-5" />
              </Link>
            )}

            <CartDrawer />
          </div>
        </div>
      </Container>

      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}
