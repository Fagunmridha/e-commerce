'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { useLanguage } from '@/components/language-provider'

const BANNERS = [
  {
    key: 'left',
    href: '/shop',
    image:
      'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1000&h=700&fit=crop',
    alt: 'Knitwear and coats on display',
  },
  {
    key: 'right',
    href: '/kids',
    image:
      'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=1000&h=700&fit=crop',
    alt: 'Children wearing colourful clothing',
  },
] as const

export function PromoBanners() {
  const { t } = useLanguage()
  const copy = t.home.promo

  const content = {
    left: { title: copy.leftTitle, subtitle: copy.leftSubtitle, cta: copy.leftCta },
    right: {
      title: copy.rightTitle,
      subtitle: copy.rightSubtitle,
      cta: copy.rightCta,
    },
  }

  return (
    <section className="mx-auto max-w-page px-4 py-14 sm:px-6 lg:px-10">
      <div className="grid gap-5 md:grid-cols-2">
        {BANNERS.map((banner, index) => {
          const text = content[banner.key]

          return (
            <Reveal key={banner.key} delay={index * 100}>
              <Link
                href={banner.href}
                className="group relative flex min-h-[300px] items-end overflow-hidden rounded-2xl sm:min-h-[360px]"
              >
                <img
                  src={banner.image}
                  alt={banner.alt}
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-transparent" />

                <div className="relative p-7 sm:p-9">
                  <p className="text-[11px] font-bold tracking-[0.18em] text-white/70 uppercase">
                    {copy.eyebrow}
                  </p>
                  <h3 className="mt-2 text-display-sm text-white">{text.title}</h3>
                  <p className="mt-2 max-w-sm text-sm text-white/80">
                    {text.subtitle}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 border-b-2 border-white pb-1 text-sm font-bold tracking-wide text-white uppercase">
                    {text.cta}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
