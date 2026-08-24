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
import {
  NAV_LINK_ACTIVE,
  NAV_LINK_CLASS,
} from '@/components/header/nav-link-class'
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
    <>
      {/* The strip scrolls away with the page instead of folding inside the
          sticky header. Collapsing it used to change the header's height, which
          shifted the whole document; Chrome's scroll anchoring then corrected
          the scroll position, which re-triggered the collapse — the header
          shook until you scrolled clear of the threshold. Letting it scroll off
          naturally keeps the layout height constant, so the loop can't start. */}
      <AnnouncementBar />

      <header
        className={cn(
          'sticky top-0 z-50 bg-background/95 backdrop-blur transition-shadow duration-300 supports-[backdrop-filter]:bg-background/85',
          scrolled ? 'shadow-card-hover' : 'border-b border-border',
        )}
      >
        <Container>
          {/* Fixed height on purpose — see the note in `useScrolled`. */}
          <div className="flex h-16 items-center justify-between gap-3 lg:h-20">
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
                      NAV_LINK_CLASS,
                      isActive('/') ? NAV_LINK_ACTIVE : 'text-foreground',
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
                        NAV_LINK_CLASS,
                        isActive(link.href)
                          ? NAV_LINK_ACTIVE
                          : 'text-foreground',
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
    </>
  )
}
