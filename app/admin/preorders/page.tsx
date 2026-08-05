import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAdminPreorderProducts } from '@/lib/products'
import { getPendingAdvanceOrders } from '@/lib/orders'
import { advancePct } from '@/lib/preorder'
import { ADVANCE_METHOD_LABEL } from '@/lib/order'
import { formatPrice } from '@/lib/currency'

export const dynamic = 'force-dynamic'

/** `2026-08-18` → `18 Aug 2026`. Formatted from the parts so the calendar day
 *  is never shifted by the server's timezone on its way to the screen. */
function formatDay(value?: string): string {
  if (!value) return '—'
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return value
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

export default async function AdminPreordersPage() {
  const [products, awaiting] = await Promise.all([
    getAdminPreorderProducts(),
    getPendingAdvanceOrders(),
  ])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Pre-orders</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upcoming stock shown in the homepage Coming Soon rail. Booked is
            what customers have taken; remaining is what is left of the run.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/products/new">
            <Plus className="size-4" />
            New product
          </Link>
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm font-medium text-foreground">
            No pre-order products yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Open any product and switch on “Pre-order (Coming Soon)”, then set a
            delivery date and how many pieces you are taking bookings for.
          </p>
          <Button asChild size="sm" variant="outline" className="mt-5">
            <Link href="/admin/products">Go to products</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Delivery from</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Advance</th>
                <th className="px-4 py-3 font-semibold">Booked</th>
                <th className="px-4 py-3 font-semibold">Remaining</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => {
                const booked = product.preorderBooked ?? 0
                const soldOut = product.stock === 0
                const pct = advancePct(product)

                return (
                  <tr key={product.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt=""
                          className="size-10 rounded object-cover"
                        />
                        <span className="font-medium text-foreground">
                          {product.name.en}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDay(product.preorderShipsAt)}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {pct === 0 ? (
                        <span className="text-muted-foreground">
                          None — full COD
                        </span>
                      ) : (
                        <>
                          <span className="font-medium text-foreground">
                            {pct}%
                          </span>
                          <span className="text-muted-foreground">
                            {' '}
                            ·{' '}
                            {formatPrice(
                              Math.round((product.price * pct) / 100),
                            )}
                            /pc
                          </span>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {booked}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          soldOut
                            ? 'font-semibold text-destructive'
                            : 'text-foreground'
                        }
                      >
                        {product.stock}
                      </span>
                      <span className="text-muted-foreground">
                        {' '}
                        / {booked + product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                          soldOut
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {soldOut ? 'Fully booked' : 'Open'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/products/${product.id}`}>Edit</Link>
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* The verification queue lives here rather than only on /admin/orders,
          because this is the screen someone opens when they are thinking about
          pre-orders at all. Each row links through to the order, where the
          transaction ID can be copied and ruled on. */}
      {awaiting.length > 0 && (
        <section className="mt-10">
          <h3 className="text-lg font-semibold text-foreground">
            Bookings awaiting verification
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            The customer says they sent an advance. Match the transaction ID
            against your bKash or Nagad statement, then mark it on the order.
          </p>

          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Advance</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                  <th className="px-4 py-3 font-semibold">Transaction ID</th>
                  <th className="px-4 py-3 font-semibold">Paid from</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {awaiting.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-xs font-semibold text-primary hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">
                        {order.name}
                      </span>
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {order.phone}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap text-foreground">
                      {formatPrice(order.advanceAmount)}
                      <span className="text-muted-foreground">
                        {' '}
                        of {formatPrice(order.total)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {order.advanceMethod
                        ? ADVANCE_METHOD_LABEL[order.advanceMethod]
                        : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">
                      {order.advanceTrxId ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {order.advanceSenderPhone ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
