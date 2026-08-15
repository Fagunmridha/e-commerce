'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { ClipboardList, Package, Search, Truck, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/lib/orders'
import type { SellerOrder } from '@/lib/wholesale/orders'

/** Statuses a seller can filter by, in the order an order moves through them. */
const STATUSES: OrderStatus[] = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]

/** Same palette the admin order pages use, so one status reads the same twice. */
const STATUS_TONE: Record<OrderStatus, string> = {
  pending: 'bg-amber-500/12 text-amber-700',
  processing: 'bg-sky-500/12 text-sky-700',
  shipped: 'bg-violet-500/12 text-violet-700',
  delivered: 'bg-emerald-500/12 text-emerald-700',
  cancelled: 'bg-rose-500/12 text-rose-700',
}

export function SellerOrders({ orders }: { orders: SellerOrder[] }) {
  const { t, locale, pick, price } = useLanguage()
  const copy = t.wholesale.orders

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const statusLabel: Record<OrderStatus, string> = {
    pending: copy.statusPending,
    processing: copy.statusProcessing,
    shipped: copy.statusShipped,
    delivered: copy.statusDelivered,
    cancelled: copy.statusCancelled,
  }

  const day = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  // Cancelled orders are shown, but they are not money the shop has made.
  const live = orders.filter((order) => order.status !== 'cancelled')
  const toFulfil = orders.filter(
    (order) => order.status === 'pending' || order.status === 'processing',
  ).length
  const pieces = live.reduce((sum, order) => sum + order.pieces, 0)
  const value = live.reduce((sum, order) => sum + order.subtotal, 0)

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return orders.filter(
      (order) =>
        (!status || order.status === status) &&
        (!term ||
          order.orderNumber.toLowerCase().includes(term) ||
          order.buyerName.toLowerCase().includes(term) ||
          order.buyerPhone.includes(term)),
    )
  }, [orders, search, status])

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {copy.title}
          </h1>
          <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
            {copy.subtitle}
          </p>
        </div>
      </div>

      {orders.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label={copy.statOrders}
            value={String(orders.length)}
            icon={ClipboardList}
            tone="violet"
          />
          <StatTile
            label={copy.statToFulfil}
            value={String(toFulfil)}
            icon={Truck}
            tone={toFulfil > 0 ? 'amber' : 'emerald'}
          />
          <StatTile
            label={copy.statPieces}
            value={String(pieces)}
            icon={Package}
            tone="sky"
          />
          <StatTile
            label={copy.statValue}
            value={price(value)}
            hint={copy.statValueHint}
            icon={Wallet}
            tone="emerald"
          />
        </div>
      )}

      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            {copy.title}
            {orders.length > 0 && (
              <span className="ml-2 text-muted-foreground">
                ({visible.length})
              </span>
            )}
          </h2>

          {orders.length > 0 && (
            <div className="flex flex-1 flex-wrap justify-end gap-2 sm:flex-none">
              <div className="relative min-w-48 flex-1 sm:max-w-64">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={copy.searchPlaceholder}
                  className="h-9 pl-9"
                  aria-label={copy.searchPlaceholder}
                />
              </div>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                aria-label={copy.allStatuses}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="">{copy.allStatuses}</option>
                {STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {statusLabel[value]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {orders.length === 0 ? (
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardList className="size-5" aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
              <EmptyDescription>{copy.emptyBody}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : visible.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm text-muted-foreground">{copy.noResults}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearch('')
                setStatus('')
              }}
            >
              {copy.clearFilters}
            </Button>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <tr>
                    <th className="px-5 py-3 font-medium">{copy.colOrder}</th>
                    <th className="px-4 py-3 font-medium">{copy.colBuyer}</th>
                    <th className="px-4 py-3 font-medium">{copy.colItems}</th>
                    <th className="px-4 py-3 text-right font-medium">
                      {copy.colValue}
                    </th>
                    <th className="px-5 py-3 text-right font-medium">
                      {copy.colStatus}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((order) => (
                    <tr
                      key={order.id}
                      className="border-t border-border transition-colors hover:bg-muted/40"
                    >
                      <td className="px-5 py-3">
                        <p className="font-mono font-medium text-foreground">
                          {order.orderNumber}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {day(order.placedAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">
                          {order.buyerName}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {order.buyerCity} · {order.buyerPhone}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {order.items.slice(0, 3).map((line, index) => (
                              <Image
                                key={index}
                                src={line.image}
                                alt=""
                                width={32}
                                height={32}
                                className="size-8 rounded-md border border-border bg-background object-cover"
                              />
                            ))}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-foreground">
                              {pick(order.items[0]!.name)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {copy.pieces.replace('{n}', String(order.pieces))}
                              {order.items.length > 1 &&
                                ` · ${copy.moreItems.replace(
                                  '{n}',
                                  String(order.items.length - 1),
                                )}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">
                        {price(order.subtotal)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Badge
                          variant="secondary"
                          className={cn('border-0', STATUS_TONE[order.status])}
                        >
                          {statusLabel[order.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: the same rows as cards, so nothing scrolls sideways. */}
            <ul className="divide-y divide-border md:hidden">
              {visible.map((order) => (
                <li key={order.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono font-medium text-foreground">
                        {order.orderNumber}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {day(order.placedAt)}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn('border-0', STATUS_TONE[order.status])}
                    >
                      {statusLabel[order.status]}
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {order.items.slice(0, 3).map((line, index) => (
                        <Image
                          key={index}
                          src={line.image}
                          alt=""
                          width={32}
                          height={32}
                          className="size-8 rounded-md border border-border bg-background object-cover"
                        />
                      ))}
                    </div>
                    <p className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {pick(order.items[0]!.name)}
                    </p>
                    <p className="font-semibold tabular-nums text-foreground">
                      {price(order.subtotal)}
                    </p>
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {order.buyerName} · {order.buyerCity} · {order.buyerPhone}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </>
  )
}

const TILE_TONE = {
  violet: 'bg-violet-500/12 text-violet-600',
  sky: 'bg-sky-500/12 text-sky-600',
  emerald: 'bg-emerald-500/12 text-emerald-600',
  amber: 'bg-amber-500/12 text-amber-600',
}

function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  hint?: string
  icon: typeof Package
  tone: keyof typeof TILE_TONE
}) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight tabular-nums text-foreground">
            {value}
          </p>
          {hint && (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {hint}
            </p>
          )}
        </div>
        <span
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-lg',
            TILE_TONE[tone],
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  )
}
