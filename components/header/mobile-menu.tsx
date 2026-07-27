'use client'

import Link from 'next/link'
import { ChevronRight, LogIn, Menu, User } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { BrandMark } from '@/components/header/brand-mark'
import { LanguageSelect } from '@/components/language-select'
import { useLanguage } from '@/components/language-provider'
import { useCatalogue } from '@/components/catalogue-provider'
import type { Dictionary } from '@/lib/dictionaries'
import { cn } from '@/lib/utils'

/**
 * The phone/tablet navigation drawer. Designed for thumbs: 48px rows, the
 * category list broken out with item counts, and account plus language at the
 * bottom where they are easy to reach.
 */
export function MobileMenu({
  links,
  isActive,
}: {
  links: { key: keyof Dictionary['nav']; href: string }[]
  isActive: (href: string) => boolean
}) {
  const { t, pick } = useLanguage()
  const { categories } = useCatalogue()
  const { isSignedIn } = useUser()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="grid size-11 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none lg:hidden"
          aria-label={t.header.openMenu}
        >
          <Menu className="size-5" />
        </button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[19rem] gap-0 p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle asChild>
            <div>
              <BrandMark />
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <nav aria-label={t.header.openMenu}>
            <ul className="flex flex-col p-3">
              {links.map((link) => (
                <li key={link.href}>
                  <SheetClose asChild>
                    <Link
                      href={link.href}
                      className={cn(
                        'flex min-h-12 items-center rounded-xl px-3 text-base font-medium transition-colors hover:bg-secondary',
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
          </nav>

          <div className="border-t border-border p-3">
            <p className="px-3 pt-2 pb-3 text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">
              {t.header.mega.shopByCategory}
            </p>
            <ul className="flex flex-col">
              {categories.map((category) => (
                <li key={category.slug}>
                  <SheetClose asChild>
                    <Link
                      href={category.href}
                      className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                    >
                      {pick(category.name)}
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {category.itemCount}
                        <ChevronRight className="size-4" aria-hidden="true" />
                      </span>
                    </Link>
                  </SheetClose>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-3 border-t border-border p-5">
          <SheetClose asChild>
            <Link
              href={isSignedIn ? '/account' : '/sign-in'}
              className="flex min-h-12 items-center gap-2.5 rounded-xl bg-secondary px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent hover:text-primary"
            >
              {isSignedIn ? (
                <User className="size-4" />
              ) : (
                <LogIn className="size-4" />
              )}
              {isSignedIn ? t.header.account : t.header.signIn}
            </Link>
          </SheetClose>
          <LanguageSelect className="w-full [&>select]:w-full" />
        </div>
      </SheetContent>
    </Sheet>
  )
}
