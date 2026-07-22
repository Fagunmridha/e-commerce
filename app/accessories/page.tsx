import type { Metadata } from 'next'
import { CategoryPage } from '@/components/category-page'
import { categoryMetadata } from '@/lib/metadata'

export function generateMetadata(): Promise<Metadata> {
  return categoryMetadata('accessories')
}

export default function Page() {
  return <CategoryPage slug="accessories" />
}
