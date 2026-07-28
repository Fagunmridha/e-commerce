import Link from 'next/link'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  OrdersTable,
  type AdminOrderRow,
} from '@/components/admin/orders/orders-table'
import {
  getOrdersPage,
  getOrderStatusCounts,
  ORDER_STATUSES,
  type OrderStatus,
} from '@/lib/orders'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

/**
 * How many matching orders are handed to the table at once. The table paginates
 * client-side, so this is the ceiling on what a single view can hold — search
 * and the status pills run in SQL and therefore cover the whole table.
 */
const PAGE_SIZE = 500

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const { status, q } = await searchParams
  const active = ORDER_STATUSES.find((value) => value === status) as
    | OrderStatus
    | undefined

  const [{ rows, total }, counts] = await Promise.all([
    getOrdersPage({ status: active, q, pageSize: PAGE_SIZE }),
    getOrderStatusCounts(),
  ])

  const orders: AdminOrderRow[] = rows.map((row) => ({
    id: row.id,
    orderNumber: row.orderNumber,
    customer: row.name,
    phone: row.phone,
    itemCount: row.itemCount,
    subtotal: row.subtotal,
    discount: row.discount,
    couponCode: row.couponCode,
    total: row.total,
    paymentMethod: row.paymentMethod,
    status: row.status,
    placedAt: row.placedAt.toISOString(),
  }))

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Orders</h2>
          <p className="text-sm text-muted-foreground">
            {total} order{total === 1 ? '' : 's'}
            {active ? ` with status “${active}”` : ''}
            {q ? ` matching “${q}”` : ''}.
          </p>
        </div>

        {/* Search runs in SQL, so it reaches orders beyond the loaded page. */}
        <form className="flex gap-2" action="/admin/orders">
          {active && <input type="hidden" name="status" value={active} />}
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={q ?? ''}
              placeholder="Order number, name or phone…"
              className="h-9 w-64 pl-8"
            />
          </div>
          <Button type="submit" variant="outline" className="h-9">
            Search
          </Button>
          {q && (
            <Button asChild variant="ghost" className="h-9">
              <Link href={active ? `/admin/orders?status=${active}` : '/admin/orders'}>
                Clear
              </Link>
            </Button>
          )}
        </form>
      </div>

      {/* The dashboard and the header bell both deep-link here with a status,
          so the filter has to be honoured rather than silently ignored. */}
      <nav className="mb-6 flex flex-wrap gap-1.5">
        {[undefined, ...ORDER_STATUSES].map((value) => {
          const href = value ? `/admin/orders?status=${value}` : '/admin/orders'
          return (
            <Link
              key={value ?? 'all'}
              href={q ? `${href}${value ? '&' : '?'}q=${encodeURIComponent(q)}` : href}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors',
                active === value
                  ? 'border-transparent bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted',
              )}
            >
              {value ?? 'All'}
              <span className="ml-1.5 opacity-70">
                {counts[value ?? 'all']}
              </span>
            </Link>
          )
        })}
      </nav>

      {total > PAGE_SIZE && (
        <p className="mb-3 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          Showing the {PAGE_SIZE} most recent of {total} matching orders. Narrow
          it down with the search box or a status filter to see the rest.
        </p>
      )}

      <OrdersTable orders={orders} />
    </div>
  )
}
