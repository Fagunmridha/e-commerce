'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignOutButton, useUser } from '@clerk/nextjs'
import {
  ClipboardList,
  Heart,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  Store,
  UserRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'
import type { AccountContext } from '@/lib/account'
import type { Localized } from '@/lib/i18n'

type NavItem = { href: string; label: Localized; icon: LucideIcon }

/**
 * The wholesale entries for this account. Which ones exist depends entirely on
 * where the person stands, because the programme's two sides are exclusive and
 * each has a different set of places to go:
 *
 *   - never joined        → one door in: the pitch page
 *   - buyer               → the market they order from (no approval needed)
 *   - seller, approved    → the seller console
 *   - seller, suspended   → what they are still owed, and where they stand
 *   - seller, otherwise   → their application (pending, rejected, or unfinished)
 *
 * These leave /account for the wholesale pages, which have their own shells, so
 * none of them is ever the "active" row here.
 */
function wholesaleItems({
  wholesaleRole,
  wholesaleStatus,
}: Pick<AccountContext, 'wholesaleRole' | 'wholesaleStatus'>): NavItem[] {
  if (wholesaleRole === 'buyer') {
    return [
      {
        href: '/wholesale/market',
        label: { en: 'Wholesale market', bn: 'পাইকারি বাজার' },
        icon: Store,
      },
    ]
  }

  if (wholesaleRole === 'seller') {
    const application: NavItem = {
      href: '/wholesale/apply',
      label: { en: 'My application', bn: 'আমার আবেদন' },
      icon: ClipboardList,
    }

    if (wholesaleStatus === 'approved') {
      return [
        {
          href: '/wholesale/dashboard',
          label: { en: 'Seller dashboard', bn: 'সেলার ড্যাশবোর্ড' },
          icon: LayoutDashboard,
        },
        {
          href: '/wholesale/dashboard/products/new',
          label: { en: 'Add product', bn: 'পণ্য যোগ করুন' },
          icon: Plus,
        },
        {
          href: '/wholesale/dashboard/orders',
          label: { en: 'Shop orders', bn: 'দোকানের অর্ডার' },
          icon: ClipboardList,
        },
        {
          href: '/wholesale/payouts',
          label: { en: 'Payouts', bn: 'পেআউট' },
          icon: Wallet,
        },
      ]
    }

    if (wholesaleStatus === 'suspended') {
      return [
        {
          href: '/wholesale/payouts',
          label: { en: 'Payouts', bn: 'পেআউট' },
          icon: Wallet,
        },
        application,
      ]
    }

    return [application]
  }

  return [
    {
      href: '/wholesale',
      label: { en: 'Become a wholesaler', bn: 'পাইকারি ব্যবসায়ী হন' },
      icon: Store,
    },
  ]
}

function initials(name: string | null, email: string): string {
  const source = (name || email).trim()
  const parts = source.split(/\s+/).filter(Boolean)
  const letters =
    parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2)
  return letters.toUpperCase()
}

/**
 * The account area's navigation: a sticky sidebar from `lg` up, and a
 * horizontally scrolling row of pills below it — the same links, so nothing is
 * reachable on one and missing on the other.
 */
export function AccountNav({
  name,
  email,
  wholesaleRole,
  wholesaleStatus,
}: Pick<
  AccountContext,
  'name' | 'email' | 'wholesaleRole' | 'wholesaleStatus'
>) {
  const pathname = usePathname()
  const { pick } = useLanguage()
  const { user } = useUser()

  // A seller cannot buy — see `assertNotWholesaleSeller` — so a wishlist, whose
  // only purpose is buying later, has nothing to offer them. Their order
  // history stays: they may well have bought before they joined.
  const canShop = wholesaleRole !== 'seller'

  const main: NavItem[] = [
    {
      href: '/account',
      label: { en: 'Overview', bn: 'ওভারভিউ' },
      icon: LayoutDashboard,
    },
    {
      href: '/account/orders',
      label: { en: 'My orders', bn: 'আমার অর্ডার' },
      icon: Package,
    },
    ...(canShop
      ? [
          {
            href: '/account/wishlist',
            label: { en: 'Wishlist', bn: 'উইশলিস্ট' },
            icon: Heart,
          },
        ]
      : []),
    {
      href: '/account/profile',
      label: { en: 'Profile', bn: 'প্রোফাইল' },
      icon: UserRound,
    },
  ]
  const wholesale = wholesaleItems({ wholesaleRole, wholesaleStatus })

  // The overview is every other page's parent, so it only counts as active on
  // itself.
  const isActive = (href: string) =>
    href === '/account'
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`)

  const row = (item: NavItem) => {
    const active = isActive(item.href)
    const Icon = item.icon

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          active
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        <Icon className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{pick(item.label)}</span>
      </Link>
    )
  }

  const pill = (item: NavItem) => {
    const active = isActive(item.href)
    const Icon = item.icon

    return (
      <li key={item.href} className="shrink-0">
        <Link
          href={item.href}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
            active
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="size-4" aria-hidden />
          {pick(item.label)}
        </Link>
      </li>
    )
  }

  return (
    <>
      {/* Mobile and tablet */}
      <nav
        aria-label={pick({ en: 'Account', bn: 'অ্যাকাউন্ট' })}
        className="-mx-4 overflow-x-auto px-4 pb-1 lg:hidden"
      >
        <ul className="flex w-max gap-2">
          {[...main, ...wholesale].map(pill)}
        </ul>
      </nav>

      {/* Desktop */}
      <aside className="hidden lg:block">
        <div className="sticky top-28 space-y-5 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt=""
                className="size-11 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
              >
                {initials(name, email)}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {name || email}
              </p>
              {name && (
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              )}
            </div>
          </div>

          <nav
            aria-label={pick({ en: 'Account', bn: 'অ্যাকাউন্ট' })}
            className="space-y-5"
          >
            <div className="space-y-1">{main.map(row)}</div>

            <div className="space-y-1 border-t border-border pt-4">
              <p className="px-3 pb-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                {pick({ en: 'Wholesale', bn: 'পাইকারি' })}
              </p>
              {wholesale.map(row)}
            </div>
          </nav>

          <div className="border-t border-border pt-3">
            <SignOutButton redirectUrl="/">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="size-4 shrink-0" aria-hidden />
                {pick({ en: 'Sign out', bn: 'সাইন আউট' })}
              </button>
            </SignOutButton>
          </div>
        </div>
      </aside>
    </>
  )
}
