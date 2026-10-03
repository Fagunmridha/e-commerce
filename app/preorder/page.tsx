import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { PreorderListing } from '@/components/preorder/preorder-listing'
import { FeatureBar } from '@/components/feature-bar'
import { pageMetadata } from '@/lib/metadata'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata('preorder')
}

export default function PreorderPage() {
  return (
    <>
      <PageHeader pageKey="preorder" />
      <PreorderListing />
      <FeatureBar />
    </>
  )
}
