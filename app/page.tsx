import { Hero } from '@/components/hero'
import { FeatureBar } from '@/components/feature-bar'
import { CategoryGrid } from '@/components/category-grid'
import { PopularProducts } from '@/components/popular-products'

export default function Home() {
  return (
    <>
      <Hero />
      <FeatureBar />
      <CategoryGrid />
      <PopularProducts />
    </>
  )
}
