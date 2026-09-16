import type { Metadata } from 'next'
import { WholesaleMarket } from '@/components/wholesale/wholesale-market'
import { pageMetadata } from '@/lib/metadata'

// Joined wholesale buyers only — the gate is in ./layout.tsx.
export const dynamic = 'force-dynamic'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata('wholesaleMarket')
}

export default function WholesaleMarketPage() {
  // No `PageHeader`: `WholesaleMarket` opens with its own hero, which carries
  // the breadcrumb and swaps its title for the open category's name. The band
  // above it was a second heading over the first.
  return <WholesaleMarket />
}
