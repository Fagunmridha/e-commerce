import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { ShopBrowser } from '@/components/shop-browser'
import { FeatureBar } from '@/components/feature-bar'
import { pageMetadata } from '@/lib/metadata'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata('shop')
}

export default function ShopPage() {
  return (
    <>
      <PageHeader pageKey="shop" />
      <ShopBrowser />
      <FeatureBar />
    </>
  )
}
