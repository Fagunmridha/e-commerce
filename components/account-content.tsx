'use client'

import Link from 'next/link'
import { Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import type { Localized } from '@/lib/i18n'

export type AccountOrder = {
  orderNumber: string
  placedAt: string
  status: string
  total: number
  itemCount: number
}

const STATUS_LABELS: Record<string, Localized> = {
  pending: { en: 'Pending', bn: 'অপেক্ষমাণ' },
  processing: { en: 'Processing', bn: 'প্রক্রিয়াধীন' },
  shipped: { en: 'Shipped', bn: 'পাঠানো হয়েছে' },
  delivered: { en: 'Delivered', bn: 'পৌঁছে গেছে' },
  cancelled: { en: 'Cancelled', bn: 'বাতিল' },
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  delivered: 'bg-badge-new/15 text-badge-new',
  cancelled: 'bg-destructive/10 text-destructive',
}

export function AccountContent({
  name,
  email,
  orders,
}: {
  name: string | null
  email: string
  orders: AccountOrder[]
}) {
  const { pick, price, locale } = useLanguage()

  const label = (value: Localized) => pick(value)

  return (
    <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
          {label({ en: 'Signed in as', bn: 'সাইন ইন করেছেন' })}
        </p>
        <h1 className="mt-1 text-xl font-bold text-foreground">
          {name || email}
        </h1>
        {name && <p className="text-sm text-muted-foreground">{email}</p>}
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          {label({ en: 'My Orders', bn: 'আমার অর্ডার' })}
        </h2>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card px-4 py-14 text-center">
            <Package
              className="size-12 text-muted-foreground/40"
              strokeWidth={1.25}
            />
            <p className="text-sm text-muted-foreground">
              {label({ en: 'No orders yet.', bn: 'এখনো কোনো অর্ডার নেই।' })}
            </p>
            <Button asChild>
              <Link href="/shop">
                {label({ en: 'Start shopping', bn: 'কেনাকাটা শুরু করুন' })}
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <li
                key={order.orderNumber}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
              >
                <div>
                  <p className="font-semibold text-foreground">
                    {order.orderNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.placedAt).toLocaleDateString(
                      locale === 'bn' ? 'bn-BD' : 'en-US',
                      { year: 'numeric', month: 'short', day: 'numeric' },
                    )}{' '}
                    ·{' '}
                    {order.itemCount}{' '}
                    {label({ en: 'items', bn: 'পণ্য' })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      STATUS_STYLES[order.status] ?? ''
                    }`}
                  >
                    {label(STATUS_LABELS[order.status] ?? { en: order.status, bn: order.status })}
                  </span>
                  <span className="font-semibold text-foreground">
                    {price(order.total)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
