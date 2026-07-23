'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/components/language-provider'
import { useCatalogue } from '@/components/catalogue-provider'

export function CpMarketFuture() {
  const { pick } = useLanguage()
  const { products: allProducts } = useCatalogue()
  
  const products = useMemo(() => {
    // We'll grab 4 different products from the end of the array to act as 'future' products
    return [...allProducts].reverse().slice(0, 4)
  }, [allProducts])

  return (
    <section className="py-8 bg-[#f8fafc] pb-16 border-b border-gray-100">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Future Products</h2>
          <span className="text-xs font-bold tracking-wider text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full uppercase">
            Coming Soon
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((p) => {
            const label = pick(p.name)
            return (
              <div key={p.id} className="group block opacity-95">
                <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-gray-200 mb-4 cursor-not-allowed">
                  <div className="absolute inset-0 bg-white/20 z-10 transition-colors group-hover:bg-white/10"></div>
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 text-sm font-bold bg-black/80 backdrop-blur-sm text-white rounded z-20 whitespace-nowrap shadow-lg">
                    Coming Soon
                  </span>
                  <img 
                    src={p.image || '/placeholder.svg'} 
                    alt={label} 
                    className="h-full w-full object-cover object-center grayscale-[20%] group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="text-sm font-medium text-gray-700">{label}</h3>
                <p className="mt-1 text-sm font-semibold text-gray-400">TBA</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
