'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useLanguage } from '@/components/language-provider'
import { useCatalogue } from '@/components/catalogue-provider'
import { cn } from '@/lib/utils'

const BADGE_STYLES: Record<string, string> = {
  new: 'bg-[#5b5ff8] text-white',
  sale: 'bg-red-500 text-white',
}

export function CpMarketPopular() {
  const { pick, price: formatPrice, t } = useLanguage()
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
          {products.map((p) => {
            const label = pick(p.name)
            return (
              <Link key={p.id} href={`/product/${p.id}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-[#f4f6f8] mb-4">
                  {p.badge && (
                    <span className={cn('absolute top-3 left-3 px-2 py-1 text-xs font-bold rounded z-10', BADGE_STYLES[p.badge] || 'bg-[#5b5ff8] text-white')}>
                      {t.badges[p.badge] || p.badge}
                    </span>
                  )}
                  <img 
                    src={p.image || '/placeholder.svg'} 
                    alt={label} 
                    className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{label}</h3>
                <p className="mt-1 text-sm font-semibold text-gray-900">{formatPrice(p.price)}</p>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
