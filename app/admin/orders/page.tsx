import { getAllOrders } from '@/lib/orders'
import { OrderStatusSelect } from '@/components/admin/order-status-select'

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage() {
  const orders = await getAllOrders()

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-foreground">Orders</h2>
      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders yet.</p>
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
