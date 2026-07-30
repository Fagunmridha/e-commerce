import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RoleToggle } from '@/components/admin/role-toggle'
import { StatCard } from '@/components/admin/dashboard/stat-card'
import { getCurrentUser } from '@/lib/auth'
import { getCustomerById, getCustomerOrders } from '@/lib/admin/customers'
import type { OrderRow } from '@/lib/db/schema'
import { formatPrice } from '@/lib/currency'

export const dynamic = 'force-dynamic'

const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-amber-500/12 text-amber-700 dark:text-amber-400',
  processing: 'bg-sky-500/12 text-sky-700 dark:text-sky-400',
  shipped: 'bg-violet-500/12 text-violet-700 dark:text-violet-400',
  delivered: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400',
  cancelled: 'bg-rose-500/12 text-rose-700 dark:text-rose-400',
}

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const numericId = Number(id)
  if (!Number.isInteger(numericId)) notFound()

  const [me, customer] = await Promise.all([
    getCurrentUser(),
    getCustomerById(numericId),
  ])
  if (!customer) notFound()

  const { owned, guessedGuest } = await getCustomerOrders(customer)

  const averageOrder =
    customer.orderCount > 0 ? customer.lifetimeValue / customer.orderCount : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
            <Link href="/admin/users">
              <ArrowLeft className="size-4" />
              All customers
            </Link>
          </Button>
          <h2 className="text-xl font-bold text-foreground">
            {customer.name || customer.email}
            {me?.id === customer.id && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                (you)
              </span>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">{customer.email}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {customer.clerkId}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={
              customer.role === 'admin'
                ? 'border-0 bg-primary/10 capitalize text-primary'
                : 'border-0 bg-muted capitalize text-muted-foreground'
            }
          >
            {customer.role}
          </Badge>
          <RoleToggle
            userId={customer.id}
            role={customer.role}
            isSelf={me?.id === customer.id}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Lifetime value"
          value={formatPrice(customer.lifetimeValue)}
          hint="Cancelled orders excluded"
          icon="revenue"
        />
        <StatCard
          label="Orders"
          value={String(customer.orderCount)}
          hint={
            customer.lastOrderAt
              ? `Last on ${customer.lastOrderAt.toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}`
              : 'No orders yet'
          }
          icon="orders"
          accent="sky"
        />
        <StatCard
          label="Average order"
          value={formatPrice(averageOrder)}
          hint={`Joined ${customer.createdAt.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}`}
          icon="trending"
          accent="emerald"
        />
      </div>

      <OrderList title="Orders" orders={owned} emptyText="No orders yet." />

      {guessedGuest.length > 0 && (
        <OrderList
          title="Possible guest orders"
          orders={guessedGuest}
          // Matched on phone number alone — nothing links these to the account,
          // so they are shown separately and left out of the totals above.
          note="Matched by phone number only. Not verified, and not counted in the figures above."
        />
      )}
    </div>
  )
}

function OrderList({
  title,
  orders,
  emptyText,
  note,
}: {
  title: string
  orders: OrderRow[]
  emptyText?: string
  note?: string
}) {
  return (
    <section className="rounded-xl border border-border">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
      </div>

      {orders.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-border">
          {orders.map((order) => (
            <li
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="font-mono text-sm font-semibold text-primary hover:underline"
                >
                  {order.orderNumber}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {order.placedAt.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  · {order.itemCount} item{order.itemCount === 1 ? '' : 's'}
                  {order.couponCode && ` · ${order.couponCode}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className={`border-0 capitalize ${STATUS_CLASS[order.status]}`}
                >
                  {order.status}
                </Badge>
                <span className="font-semibold">
                  {formatPrice(order.total)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
