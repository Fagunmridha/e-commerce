'use client'

import Link from 'next/link'
import { ChevronRight, Heart, Package, ShoppingBag, Truck, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import { IN_PROGRESS, OrderList } from '@/components/account/order-list'
import type { AccountContext, AccountOrder } from '@/lib/account'

const RECENT = 5

/** The card that answers "where do I stand with wholesale?" for whoever is asking. */
function useWholesaleCard({
  wholesaleRole,
  wholesaleStatus,
}: Pick<AccountContext, 'wholesaleRole' | 'wholesaleStatus'>) {
  const { t, pick } = useLanguage()
  const s = t.wholesale.status

  if (wholesaleRole === 'buyer') {
    return {
      title: pick({ en: 'You are a wholesale buyer', bn: 'আপনি একজন পাইকারি ক্রেতা' }),
      body: pick({
        en: 'Order trade stock at wholesale prices from the market.',
        bn: 'বাজার থেকে পাইকারি দামে পণ্য অর্ডার করুন।',
      }),
      cta: s.marketCta,
      href: '/wholesale/market',
      primary: false,
    }
  }

  if (wholesaleRole === 'seller') {
    switch (wholesaleStatus) {
      case 'approved':
        return { title: s.approvedTitle, body: s.approvedBody, cta: s.approvedCta, href: '/wholesale/dashboard', primary: true }
      case 'suspended':
        return {
          title: s.suspendedTitle,
          body: s.suspendedBody,
          cta: pick({ en: 'View details', bn: 'বিস্তারিত দেখুন' }),
          href: '/wholesale/apply',
          primary: false,
        }
      case 'rejected':
        return { title: s.rejectedTitle, body: s.rejectedBody, cta: s.edit, href: '/wholesale/apply', primary: false }
      case 'pending':
        return {
          title: s.pendingTitle,
          body: pick({
            en: 'We will let you know as soon as it has been reviewed.',
            bn: 'যাচাই শেষ হলেই আপনাকে জানানো হবে।',
          }),
          cta: pick({ en: 'View application', bn: 'আবেদন দেখুন' }),
          href: '/wholesale/apply',
          primary: false,
        }
      default:
        // Chose to sell but never submitted the form.
        return {
          title: pick({ en: 'Finish your application', bn: 'আবেদনটি সম্পূর্ণ করুন' }),
          body: pick({
            en: 'Tell us about your shop and we will review it.',
            bn: 'আপনার দোকানের তথ্য দিন, আমরা যাচাই করে দেখব।',
          }),
          cta: pick({ en: 'Continue', bn: 'চালিয়ে যান' }),
          href: '/wholesale/apply',
          primary: true,
        }
    }
  }

  return {
    title: t.wholesale.title,
    body: t.wholesale.subtitle,
    cta: t.home.heroCards.wholesaleCta,
    href: '/wholesale',
    primary: false,
  }
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" aria-hidden />
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  )
}

/** The landing page of the account area: a greeting, the numbers, the latest orders. */
export function AccountOverview({
  name,
  email,
  orders,
  wholesaleRole,
  wholesaleStatus,
}: Pick<AccountContext, 'name' | 'email' | 'wholesaleRole' | 'wholesaleStatus'> & {
  orders: AccountOrder[]
}) {
  const { pick, price } = useLanguage()
  const wholesale = useWholesaleCard({ wholesaleRole, wholesaleStatus })
  const canShop = wholesaleRole !== 'seller'

  const inProgress = orders.filter((o) => IN_PROGRESS.includes(o.status)).length
  const delivered = orders.filter((o) => o.status === 'delivered').length
  // A cancelled order was never paid for.
  const spent = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0)

  const first = (name || email.split('@')[0]).split(' ')[0]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {pick({ en: `Welcome back, ${first}`, bn: `স্বাগতম, ${first}` })}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pick({
            en: 'Track your orders and manage your account.',
            bn: 'আপনার অর্ডার ও অ্যাকাউন্ট এখান থেকে দেখুন।',
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={ShoppingBag}
          label={pick({ en: 'Total orders', bn: 'মোট অর্ডার' })}
          value={orders.length.toLocaleString()}
        />
        <Stat
          icon={Truck}
          label={pick({ en: 'In progress', bn: 'চলমান' })}
          value={inProgress.toLocaleString()}
        />
        <Stat
          icon={Package}
          label={pick({ en: 'Delivered', bn: 'পৌঁছেছে' })}
          value={delivered.toLocaleString()}
        />
        <Stat
          icon={Wallet}
          label={pick({ en: 'Total spent', bn: 'মোট খরচ' })}
          value={price(spent)}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-5">
        <div className="min-w-0 max-w-xl">
          <h2 className="text-sm font-semibold text-foreground">{wholesale.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{wholesale.body}</p>
        </div>
        <Button asChild variant={wholesale.primary ? 'default' : 'outline'} size="sm">
          <Link href={wholesale.href}>{wholesale.cta}</Link>
        </Button>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {pick({ en: 'Recent orders', bn: 'সাম্প্রতিক অর্ডার' })}
          </h2>
          {orders.length > RECENT && (
            <Link
              href="/account/orders"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {pick({ en: 'View all', bn: 'সব দেখুন' })}
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>
        <OrderList orders={orders.slice(0, RECENT)} />
      </section>

      {canShop && (
        <Link
          href="/account/wishlist"
          className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-sm font-medium text-foreground transition-colors hover:border-primary/40"
        >
          <Heart className="size-4 text-muted-foreground" aria-hidden />
          {pick({ en: 'Your wishlist', bn: 'আপনার উইশলিস্ট' })}
          <ChevronRight className="ml-auto size-4 text-muted-foreground" aria-hidden />
        </Link>
      )}
    </div>
  )
}
