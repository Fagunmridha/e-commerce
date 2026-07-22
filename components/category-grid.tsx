'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { SectionHeading } from '@/components/section-heading'
import { useLanguage } from '@/components/language-provider'
import { CATEGORIES } from '@/lib/data'

export function CategoryGrid() {
  const { t, pick } = useLanguage()

  return (
    <section className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
      <Reveal>
        <SectionHeading
          eyebrow={t.home.categoriesEyebrow}
          title={t.home.categoriesTitle}
          linkLabel={t.sections.viewAll}
          linkHref="/shop"
        />
      </Reveal>

      {/* First tile spans two columns on large screens so the grid has a focal point. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {CATEGORIES.map((category, index) => (
          <Reveal
            key={category.slug}
            delay={index * 90}
            className={index === 0 ? 'lg:col-span-2' : undefined}
          >
            <Link
              href={category.href}
              className="group relative flex h-full min-h-[220px] items-end overflow-hidden rounded-2xl sm:min-h-[300px]"
            >
              <img
                src={category.image}
                alt={pick(category.name)}
                loading="lazy"
                className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-transparent" />

              <div className="relative flex w-full items-end justify-between gap-3 p-5">
                <div>
                  <h3 className="text-lg font-bold text-white sm:text-xl">
                    {pick(category.name)}
                  </h3>
                  <p className="text-xs text-white/75">
                    {category.itemCount} {t.sections.items}
                  </p>
                </div>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition-colors group-hover:bg-white group-hover:text-slate-900">
                  <ArrowUpRight className="size-4" />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
