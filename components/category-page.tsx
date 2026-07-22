'use client'

import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { ProductGrid } from '@/components/product-grid'
import { FeatureBar } from '@/components/feature-bar'
import { useLanguage } from '@/components/language-provider'
import { getCategory, getProductsByCategory, type CategorySlug } from '@/lib/data'

export function CategoryPage({ slug }: { slug: CategorySlug }) {
  const { t, pick } = useLanguage()
  const category = getCategory(slug)

  if (!category) notFound()

  const name = pick(category.name)
  const products = getProductsByCategory(slug)

  return (
    <>
      <PageHeader
        title={name}
        description={t.categoryDescriptions[slug]}
        breadcrumb={name}
      />
      <div className="py-10">
        <ProductGrid
          countTitle
          products={products}
          emptyMessage={t.sections.noProductsInCategory}
        />
      </div>
      <FeatureBar />
    </>
  )
}
