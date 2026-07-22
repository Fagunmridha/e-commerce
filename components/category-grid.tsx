'use client'

import Link from 'next/link'
import { useLanguage } from '@/components/language-provider'
import { CATEGORIES } from '@/lib/data'

export function CategoryGrid() {
  const { t, pick } = useLanguage()

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {t.sections.topCategories}
      </h2>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {CATEGORIES.map((category) => (
          <Link
            key={category.slug}
            href={category.href}
            className="group relative overflow-hidden rounded-lg"
          >
            <img
              src={category.image}
              alt={pick(category.name)}
              loading="lazy"
              className="aspect-4/3 w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 p-4">
              <h3 className="text-sm font-semibold text-white sm:text-base">
                {pick(category.name)}
              </h3>
              <p className="text-xs text-white/80">
                {category.itemCount} {t.sections.items}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
