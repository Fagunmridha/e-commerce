'use client'

import { useMemo, useState } from 'react'
import { useLanguage } from '@/components/language-provider'
import {
  IN_PROGRESS,
  ORDER_STATUS_LABELS,
  OrderList,
} from '@/components/account/order-list'
import { cn } from '@/lib/utils'
import type { AccountOrder } from '@/lib/account'

type Filter = 'all' | 'active' | 'delivered' | 'cancelled'

const FILTERS: { key: Filter; label: { en: string; bn: string } }[] = [
  { key: 'all', label: { en: 'All', bn: 'সব' } },
  { key: 'active', label: { en: 'In progress', bn: 'চলমান' } },
  { key: 'delivered', label: ORDER_STATUS_LABELS.delivered },
  { key: 'cancelled', label: ORDER_STATUS_LABELS.cancelled },
]

function matches(order: AccountOrder, filter: Filter) {
  if (filter === 'all') return true
  if (filter === 'active') return IN_PROGRESS.includes(order.status)
  return order.status === filter
}

/** Every order the customer has placed, with a filter by where it stands. */
export function AccountOrders({ orders }: { orders: AccountOrder[] }) {
  const { pick } = useLanguage()
  const [filter, setFilter] = useState<Filter>('all')

  const counts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map(({ key }) => [key, orders.filter((o) => matches(o, key)).length]),
      ) as Record<Filter, number>,
    [orders],
  )
  const shown = orders.filter((o) => matches(o, filter))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {pick({ en: 'My orders', bn: 'আমার অর্ডার' })}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pick({
            en: `${orders.length} in total`,
            bn: `মোট ${orders.length.toLocaleString('bn-BD')}টি`,
          })}
        </p>
      </div>

      {orders.length > 0 && (
        <div
          role="tablist"
          aria-label={pick({ en: 'Filter orders', bn: 'অর্ডার ফিল্টার' })}
          className="flex flex-wrap gap-2"
        >
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              onClick={() => setFilter(key)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                filter === key
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              {pick(label)}
              <span className="ml-1.5 tabular-nums opacity-70">{counts[key]}</span>
            </button>
          ))}
        </div>
      )}

      <OrderList
        orders={shown}
        emptyText={
          orders.length > 0
            ? { en: 'No orders match this filter.', bn: 'এই ফিল্টারে কোনো অর্ডার নেই।' }
            : undefined
        }
      />
    </div>
  )
}
