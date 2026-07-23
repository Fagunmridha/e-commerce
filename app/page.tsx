import { CpMarketHero } from '@/components/cp-market-hero'
import { CpMarketFeatures } from '@/components/cp-market-features'
import { CpMarketCategories } from '@/components/cp-market-categories'
import { CpMarketPopular } from '@/components/cp-market-popular'
import { CpMarketNewsletter } from '@/components/cp-market-newsletter'

export default function Home() {
  return (
    <div className="bg-white min-h-screen">
      <CpMarketHero />
      <CpMarketFeatures />
      <CpMarketCategories />
      <CpMarketPopular />
      <CpMarketNewsletter />
    </div>
  )
}
