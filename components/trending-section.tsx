'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductCard, type ProductCardProps } from '@/components/product-card'

const TRENDING_PRODUCTS: ProductCardProps[] = [
  {
    id: '1',
    name: 'Organic Cotton Oversized Tee',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop',
    badges: ['eco-friendly', 'sustainable'],
  },
  {
    id: '2',
    name: 'Linen Summer Dress',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1595777707802-41d339d60280?w=500&h=500&fit=crop',
    badges: ['sustainable'],
  },
  {
    id: '3',
    name: 'Recycled Wool Jacket',
    price: 199.99,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=500&h=500&fit=crop',
    badges: ['eco-friendly', 'sustainable'],
  },
  {
    id: '4',
    name: 'Hemp Blend Trousers',
    price: 119.99,
    image: 'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=500&h=500&fit=crop',
    badges: ['eco-friendly'],
  },
  {
    id: '5',
    name: 'Sustainable Linen Shirt',
    price: 99.99,
    image: 'https://images.unsplash.com/photo-1596399579883-351cd95ecb2f?w=500&h=500&fit=crop',
    badges: ['sustainable'],
  },
  {
    id: '6',
    name: 'Organic Cotton Blazer',
    price: 179.99,
    image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&h=500&fit=crop',
    badges: ['eco-friendly', 'sustainable'],
  },
]

export function TrendingSection() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20" aria-label="Trending products">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Trending Now</h2>
          <p className="text-muted-foreground">Discover our most loved sustainable pieces</p>
        </div>
        <div className="hidden sm:flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none]"
        role="region"
        aria-label="Scrollable product carousel"
      >
        {TRENDING_PRODUCTS.map((product) => (
          <div key={product.id} className="flex-shrink-0 w-full sm:w-80 snap-start">
            <ProductCard {...product} />
          </div>
        ))}
      </div>
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}
