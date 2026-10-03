'use client'

import Link from 'next/link'
import { Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import type { AccountOrder } from '@/lib/account'
import type { Localized } from '@/lib/i18n'

export const ORDER_STATUS_LABELS: Record<string, Localized> = {
  pending: { en: 'Pending', bn: 'অপেক্ষমাণ' },
  processing: { en: 'Processing', bn: 'প্রক্রিয়াধীন' },
  shipped: { en: 'Shipped', bn: 'পাঠানো হয়েছে' },
  delivered: { en: 'Delivered', bn: 'পৌঁছে গেছে' },
  cancelled: { en: 'Cancelled', bn: 'বাতিল' },
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-badge-new/15 text-badge-new',
  cancelled: 'bg-destructive/10 text-destructive',
}

/** Orders that are still on their way to the customer. */
export const IN_PROGRESS = ['pending', 'processing', 'shipped']

/**
 * A list of orders, or the empty state when there are none. Shared by the
 * overview (its five latest) and the orders page (all of them), so a status
 * badge looks the same in both.
 */
export function OrderList({
  orders,
  emptyText,
}: {
  orders: AccountOrder[]
  /** Overrides the default empty message — a filter that matches nothing says so. */
  emptyText?: Localized
}) {
  const { pick, price, locale } = useLanguage()

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card px-4 py-14 text-center">
        <Package
          className="size-12 text-muted-foreground/40"
          strokeWidth={1.25}
          aria-hidden
        />
        <p className="text-sm text-muted-foreground">
          {pick(
            emptyText ?? { en: 'No orders yet.', bn: 'এখনো কোনো অর্ডার নেই।' },
          )}
        </p>
        {!emptyText && (
          <Button asChild>
            <Link href="/shop">
              {pick({ en: 'Start shopping', bn: 'কেনাকাটা শুরু করুন' })}
            </Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {orders.map((order) => (
        <li
          key={order.orderNumber}
          className="overflow-hidden rounded-lg border border-border bg-card"
        >
          {/* What was bought leads — an order number means nothing to the
              shopper until they need to quote it to support. */}
          <ul className="divide-y divide-border">
            {order.items.map((item, index) => {
              const name = pick(item.name)
              const thumb = (
                <img
                  src={item.image || '/placeholder.svg'}
                  alt=""
                  className="size-14 shrink-0 rounded-md bg-secondary object-cover"
                />
              )

              return (
                <li key={index} className="flex items-center gap-3 p-3 sm:p-4">
                  {item.productId ? (
                    <Link href={`/product/${item.productId}`}>{thumb}</Link>
                  ) : (
                    thumb
                  )}
                  <div className="min-w-0 flex-1">
                    {item.productId ? (
                      <Link
                        href={`/product/${item.productId}`}
                        className="line-clamp-2 text-sm font-semibold text-foreground hover:text-primary"
                      >
                        {name}
                      </Link>
                    ) : (
                      <p className="line-clamp-2 text-sm font-semibold text-foreground">
                        {name}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.size && (
                        <>
                          {pick({ en: 'Size', bn: 'সাইজ' })} {item.size} ·{' '}
                        </>
                      )}
                      {item.quantity} × {price(item.unitPrice)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-foreground tabular-nums">
                    {price(item.unitPrice * item.quantity)}
                  </span>
                </li>
              )
            })}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border bg-muted/40 px-3 py-2.5 sm:px-4">
            <p className="text-xs text-muted-foreground">
              {new Date(order.placedAt).toLocaleDateString(
                locale === 'bn' ? 'bn-BD' : 'en-US',
                { year: 'numeric', month: 'short', day: 'numeric' },
              )}{' '}
              · {pick({ en: 'Order', bn: 'অর্ডার' })} {order.orderNumber}
            </p>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  STATUS_STYLES[order.status] ?? ''
                }`}
              >
                {pick(
                  ORDER_STATUS_LABELS[order.status] ?? {
                    en: order.status,
                    bn: order.status,
                  },
                )}
              </span>
              <span className="text-sm font-bold text-foreground">
                {pick({ en: 'Total', bn: 'মোট' })} {price(order.total)}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
