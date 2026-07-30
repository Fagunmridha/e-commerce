import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { WholesaleMarket } from '@/components/wholesale/wholesale-market'
import { pageMetadata } from '@/lib/metadata'

// Approved wholesalers only — the gate is in ../layout.tsx.
export const dynamic = 'force-dynamic'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata('wholesaleMarket')
}

export default function WholesaleMarketPage() {
  return (
    <>
      <PageHeader pageKey="wholesaleMarket" />
      <WholesaleMarket />
    </>
  )
}
