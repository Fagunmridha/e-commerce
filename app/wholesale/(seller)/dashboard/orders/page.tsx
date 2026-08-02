import { redirect } from 'next/navigation'
import { SellerOrders } from '@/components/wholesale/seller-orders'
import { getViewerShop } from '@/lib/wholesalers'
import { getSellerOrders } from '@/lib/wholesale/orders'

export const dynamic = 'force-dynamic'

export default async function SellerOrdersPage() {
  // The shell above has already gated approval; this covers the narrow window
  // where it is revoked between the two.
  const shop = await getViewerShop()
  if (!shop) redirect('/wholesale/apply')

  const orders = await getSellerOrders(shop.id)

  return <SellerOrders orders={orders} />
}
