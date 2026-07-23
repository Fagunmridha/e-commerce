'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, Search, User } from 'lucide-react'
import { UserButton, useUser } from '@clerk/nextjs'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { CartDrawer } from '@/components/cart-drawer'
import { WishlistButton } from '@/components/wishlist-button'
import { LanguageSelect } from '@/components/language-select'
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

function Logo() {
  return (
    <Link href="/" className="text-xl font-bold tracking-tight whitespace-nowrap">
      <span className="text-primary">CP</span>{' '}
      <span className="text-foreground">Market</span>
    </Link>
  )
}

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()
  const { isSignedIn } = useUser()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault()
    const term = searchTerm.trim()
    if (!term) return
    router.push(`/shop?q=${encodeURIComponent(term)}`)
    setIsSearchOpen(false)
    setSearchTerm('')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <nav className="mx-auto flex h-16 max-w-page items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="rounded-md p-2 text-foreground transition-colors hover:bg-muted lg:hidden"
              aria-label={t.header.openMenu}
            >
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 gap-0">
            <SheetHeader className="border-b border-border px-5 py-4">
              <SheetTitle asChild>
                <div>
                  <Logo />
                </div>
              </SheetTitle>
            </SheetHeader>
            <ul className="flex flex-col px-2 py-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <SheetClose asChild>
                    <Link
                      href={link.href}
                      className={cn(
                        'block rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted',
                        isActive(link.href)
                          ? 'bg-accent text-primary'
                          : 'text-foreground',
                      )}
                    >
                      {t.nav[link.key]}
                    </Link>
                  </SheetClose>
                </li>
              ))}
            </ul>
            <div className="border-t border-border px-5 py-4">
              <LanguageSelect />
            </div>
          </SheetContent>
        </Sheet>

        <Logo />

        {/* Desktop nav */}
        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary',
                  isActive(link.href) ? 'text-primary' : 'text-foreground',
                )}
              >
                {t.nav[link.key]}
              </Link>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          <div className="hidden sm:block">
            {isSearchOpen ? (
              <form onSubmit={submitSearch}>
                <Input
                  type="search"
                  placeholder={t.header.search}
                  className="h-9 w-36 lg:w-48"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onBlur={() => !searchTerm && setIsSearchOpen(false)}
                  autoFocus
                />
              </form>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="rounded-md p-2 text-foreground transition-colors hover:bg-muted"
                aria-label={t.header.searchLabel}
              >
                <Search className="size-5" />
              </button>
            )}
          </div>

          <WishlistButton />

          {isSignedIn ? (
            <>
              <Link
                href="/account"
                className="hidden rounded-md p-2 text-foreground transition-colors hover:bg-muted sm:block"
                aria-label={t.header.account}
              >
                <User className="size-5" />
              </Link>
              <div className="ml-0.5 hidden items-center sm:flex">
                <UserButton />
              </div>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="hidden rounded-md p-2 text-foreground transition-colors hover:bg-muted sm:block"
              aria-label={t.header.account}
            >
              <User className="size-5" />
            </Link>
          )}

          <CartDrawer />

          {/* Desktop language picker — the mobile one lives in the menu sheet. */}
          <div className="ml-1.5 hidden lg:block">
            <LanguageSelect />
          </div>
        </div>
      </nav>
    </header>
  )
}
