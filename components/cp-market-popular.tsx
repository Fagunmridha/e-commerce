'use client'

import { useMemo } from 'react'
import { useCatalogue } from '@/components/catalogue-provider'
import { ProductCard } from '@/components/product-card'

export function CpMarketPopular() {
  const { products: allProducts } = useCatalogue()

  const products = useMemo(() => {
    // You can filter or sort here. We'll just grab the first 4 products for now.
    return allProducts.slice(0, 4)
  }, [allProducts])

  return (
    <section className="py-8 bg-white pb-16 border-b border-gray-100">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Popular Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  )
}
