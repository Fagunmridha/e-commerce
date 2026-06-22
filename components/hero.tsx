'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative overflow-hidden" aria-label="Hero section">
      {/* Liquid Glass Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted via-background to-muted opacity-60" />
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full mix-blend-screen filter blur-3xl" />
        <div className="absolute bottom-40 right-20 w-96 h-96 bg-accent/5 rounded-full mix-blend-screen filter blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-primary/3 rounded-full mix-blend-screen filter blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-32 lg:py-48">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center justify-center gap-2 rounded-full bg-primary/10 px-4 py-2 mb-6">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-sm font-medium text-primary">Conscious Fashion</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance">
            Sustainable Luxury,{' '}
            <span className="block text-primary mt-2">Authentically Crafted</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed text-pretty">
            Discover premium, eco-conscious fashion that doesn't compromise on elegance. Every piece tells a story of sustainable craftsmanship and transparent production.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/shop">
              <Button size="lg" className="w-full sm:w-auto">
                Shop Now
              </Button>
            </Link>
            <Link href="#sustainability">
              <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
