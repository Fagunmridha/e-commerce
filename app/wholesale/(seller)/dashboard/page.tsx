import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { SellerDashboard } from '@/components/wholesale/seller-dashboard'
import { getViewerShop } from '@/lib/wholesalers'
import { getSellerProducts } from '@/lib/products'
import { pageMetadata } from '@/lib/metadata'

export const dynamic = 'force-dynamic'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata('wholesaleDashboard')
}

export default async function SellerDashboardPage() {
  // The layout has already gated this; the null check is for the type, and for
  // the narrow window where approval is revoked between the two.
  const shop = await getViewerShop()
  if (!shop) redirect('/wholesale/apply')

  const products = await getSellerProducts(shop.id)

  return (
    <>
      <PageHeader pageKey="wholesaleDashboard" />
      <SellerDashboard shopName={shop.shopName} products={products} />
    </>
  )
}
