import type { Metadata } from 'next'
import { OrderSuccessContent } from '@/components/order-success-content'
import { getServerDictionary } from '@/lib/server-locale'
import { getOrderByNumber } from '@/lib/orders'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerDictionary()
  return { title: `${t.orderSuccess.title} ${t.meta.suffix}` }
}

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const { order: orderNumber } = await searchParams
  const order = orderNumber ? await getOrderByNumber(orderNumber) : null

  return (
    <OrderSuccessContent
      order={
        order
          ? {
              orderNumber: order.orderNumber,
              paymentMethod: order.paymentMethod,
              name: order.name,
              address: order.address,
              city: order.city,
              phone: order.phone,
              subtotal: order.subtotal,
              discount: order.discount,
              couponCode: order.couponCode,
              shipping: order.shipping,
              total: order.total,
              preorder: order.preorder,
              advanceAmount: order.advanceAmount,
              dueAmount: order.dueAmount,
              paymentStatus: order.paymentStatus,
              advanceTrxId: order.advanceTrxId,
              // Two pre-ordered lines can carry different dates, so the page
              // shows the latest — that is when the whole order can ship.
              preorderShipsAt:
                order.items
                  .map((line) => line.preorderShipsAt)
                  .filter((value): value is string => Boolean(value))
                  .sort()
                  .at(-1) ?? null,
            }
          : null
      }
    />
  )
}
