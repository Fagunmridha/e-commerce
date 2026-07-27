import Link from 'next/link'
import { getAllOrders } from '@/lib/orders'
import { OrderStatusSelect } from '@/components/admin/order-status-select'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const active = STATUSES.find((value) => value === status)

  const all = await getAllOrders()
  const orders = active ? all.filter((order) => order.status === active) : all

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-foreground">Orders</h2>

      {/* The dashboard and the header bell both deep-link here with a status,
          so the filter has to be honoured rather than silently ignored. */}
      <nav className="mb-6 flex flex-wrap gap-1.5">
        {[undefined, ...STATUSES].map((value) => (
          <Link
            key={value ?? 'all'}
            href={value ? `/admin/orders?status=${value}` : '/admin/orders'}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors',
              active === value
                ? 'border-transparent bg-primary text-primary-foreground'
                : 'border-border text-muted-foreground hover:bg-muted',
            )}
          >
            {value ?? 'All'}
            <span className="ml-1.5 opacity-70">
              {value ? all.filter((o) => o.status === value).length : all.length}
            </span>
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {active ? `No ${active} orders.` : 'No orders yet.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {order.orderNumber}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {order.name}
                    <span className="block text-xs">{order.phone}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    ${order.total.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 uppercase text-muted-foreground">
                    {order.paymentMethod}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {order.placedAt.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusSelect
                      orderId={order.id}
                      status={order.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
