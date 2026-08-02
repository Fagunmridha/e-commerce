import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eq, inArray } from 'drizzle-orm'
import { ArrowLeft, Store } from 'lucide-react'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OrderStatusSelect } from '@/components/admin/order-status-select'
import { CopyButton } from '@/components/admin/orders/copy-button'
import { PrintButton } from '@/components/admin/orders/print-button'
import { getOrderById, getOrderEvents } from '@/lib/orders'
import { formatPrice } from '@/lib/currency'

export const dynamic = 'force-dynamic'

const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-amber-500/12 text-amber-700 dark:text-amber-400',
  processing: 'bg-sky-500/12 text-sky-700 dark:text-sky-400',
  shipped: 'bg-violet-500/12 text-violet-700 dark:text-violet-400',
  delivered: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400',
  cancelled: 'bg-rose-500/12 text-rose-700 dark:text-rose-400',
}

const PAYMENT_LABEL: Record<string, string> = {
  cod: 'Cash on delivery',
  mobile: 'Mobile banking (bKash / Nagad)',
  card: 'Card',
}

const money = formatPrice

const dateTime = (value: Date) =>
  value.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await getOrderById(id)
  if (!order) notFound()

  const events = await getOrderEvents(order.id)

  // Resolve the actors in one query rather than one per event.
  const actorIds = [
    ...new Set(events.map((event) => event.actorUserId).filter(Boolean)),
  ] as number[]
  const actors = actorIds.length
    ? await db.select().from(users).where(inArray(users.id, actorIds))
    : []
  const actorNames = new Map(
    actors.map((actor) => [actor.id, actor.name || actor.email]),
  )

  const customer = order.userId
    ? (await db.select().from(users).where(eq(users.id, order.userId)))[0]
    : undefined

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
            <Link href="/admin/orders">
              <ArrowLeft className="size-4" />
              All orders
            </Link>
          </Button>
          <h2 className="font-mono text-xl font-bold text-foreground">
            {order.orderNumber}
          </h2>
          <p className="text-sm text-muted-foreground">
            Placed {dateTime(order.placedAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Not a status — this order is waiting on stock that has not landed
              yet, which is a different thing from "pending" fulfilment. */}
          {order.preorder && (
            <Badge
              variant="secondary"
              className="border-0 bg-primary/10 text-primary"
            >
              Pre-order
            </Badge>
          )}
          <Badge
            variant="secondary"
            className={`border-0 capitalize ${STATUS_CLASS[order.status]}`}
          >
            {order.status}
          </Badge>
          <OrderStatusSelect orderId={order.id} status={order.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        {/* Line items */}
        <div className="space-y-6">
          <section className="rounded-xl border border-border">
            <h3 className="border-b border-border px-4 py-3 text-sm font-semibold">
              Items ({order.itemCount})
            </h3>
            <ul className="divide-y divide-border">
              {order.items.map((line, index) => (
                <li key={index} className="flex gap-3 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={line.image}
                    alt=""
                    className="size-14 shrink-0 rounded-md border border-border object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {line.name.en}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[
                        line.size && `Size ${line.size}`,
                        line.colorEn,
                        `Qty ${line.quantity}`,
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                    {/* Marketplace lines: which shop has to be paid for this,
                        and who ships it. House stock has no seller. */}
                    {line.sellerName && (
                      <Badge
                        variant="secondary"
                        className="mt-1 border-0 bg-primary/10 text-primary"
                      >
                        <Store className="size-3" />
                        Sold by {line.sellerName}
                      </Badge>
                    )}
                    {/* The date promised when this line was booked, not the
                        product's current one — see `orderItems.preorderShipsAt`. */}
                    {line.preorderShipsAt && (
                      <p className="mt-1 text-xs font-medium text-primary">
                        Pre-order — ships from {line.preorderShipsAt}
                      </p>
                    )}
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <p className="text-sm font-semibold">
                      {money(line.unitPrice * line.quantity)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {money(line.unitPrice)} each
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 border-t border-border p-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <dt>Subtotal</dt>
                <dd>{money(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between font-medium text-badge-new">
                  <dt>
                    Discount
                    {order.couponCode && (
                      <span className="ml-1 font-mono text-xs">
                        ({order.couponCode})
                      </span>
                    )}
                  </dt>
                  <dd>−{money(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <dt>Delivery</dt>
                <dd>{order.shipping === 0 ? 'Free' : money(order.shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd>{money(order.total)}</dd>
              </div>
            </dl>
          </section>

          {/* Timeline */}
          <section className="rounded-xl border border-border print:hidden">
            <h3 className="border-b border-border px-4 py-3 text-sm font-semibold">
              History
            </h3>
            {events.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                No history recorded — this order predates status tracking.
              </p>
            ) : (
              <ol className="space-y-4 p-4">
                {events.map((event) => (
                  <li key={event.id} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium capitalize">
                        {event.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dateTime(event.createdAt)}
                        {event.actorUserId
                          ? ` · ${actorNames.get(event.actorUserId) ?? 'admin'}`
                          : ' · placed by customer'}
                      </p>
                      {event.note && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {event.note}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        {/* Customer & delivery */}
        <aside className="space-y-6">
          <section className="rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold">Customer</h3>
            <p className="mt-2 text-sm font-medium text-foreground">
              {order.name}
            </p>
            <p className="text-sm text-muted-foreground">{order.phone}</p>
            {customer ? (
              <Link
                href={`/admin/users/${customer.id}`}
                className="mt-1 inline-block text-xs text-primary hover:underline"
              >
                {customer.email} — view account
              </Link>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Guest checkout — no account
              </p>
            )}

            <h4 className="mt-4 text-xs font-semibold text-muted-foreground uppercase">
              Deliver to
            </h4>
            <p className="mt-1 text-sm text-foreground">
              {order.address}
              <br />
              {order.city}
            </p>

            <div className="mt-3 flex flex-wrap gap-2 print:hidden">
              <CopyButton
                value={`${order.name}\n${order.address}\n${order.city}\n${order.phone}`}
                label="Address"
              />
              <CopyButton value={order.phone} label="Phone" />
            </div>
          </section>

          <section className="rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold">Payment</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
            </p>
            {order.notes && (
              <>
                <h4 className="mt-4 text-xs font-semibold text-muted-foreground uppercase">
                  Order notes
                </h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  {order.notes}
                </p>
              </>
            )}
          </section>

          <PrintButton />
        </aside>
      </div>
    </div>
  )
}
