'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import useEmblaCarousel from 'embla-carousel-react'
import { ArrowRight } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'

const AUTOPLAY_MS = 3000

/**
 * Artwork and colour per slide; the copy comes from the dictionary so the
 * order here must match `t.hero.slides`.
 */
const SLIDES = [
  {
    href: '/shop',
    tint: 'bg-[#0f172a]',
    circle: 'bg-white/10',
    dots: 'text-white/25',
    image:
      'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=900&h=900&fit=crop',
    alt: 'A bright boutique interior with racks of clothing',
  },
  {
    href: '/men',
    tint: 'bg-[#1e3a5f]',
    circle: 'bg-white/10',
    dots: 'text-white/25',
    image:
      'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=900&h=900&fit=crop',
    alt: "A man wearing pieces from the men's collection",
  },
  {
    href: '/women',
    tint: 'bg-[#7c2d4a]',
    circle: 'bg-white/10',
    dots: 'text-white/25',
    image:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&h=900&fit=crop',
    alt: "A woman wearing pieces from the women's collection",
  },
  {
    href: '/kids',
    tint: 'bg-[#b45309]',
    circle: 'bg-white/10',
    dots: 'text-white/25',
    image:
      'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=900&h=900&fit=crop',
    alt: 'Children in colourful casual clothing',
  },
]

/**
 * Decorative dot grid, like the corner texture in the reference design.
 * Drawn with a CSS gradient rather than an SVG `<pattern>` so eight copies on
 * the page do not collide on a shared element id.
 */
function DotGrid({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute size-[120px] bg-[radial-gradient(currentColor_2.5px,transparent_2.5px)] bg-[length:16px_16px]',
        className,
      )}
    />
  )
}

export function Hero() {
  const { t } = useLanguage()
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (emblaApi) setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  // Auto-advance, but never fight the user: pause on hover, on touch and for
  // anyone who asked for reduced motion.
  useEffect(() => {
    if (!emblaApi) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let timer: number | undefined
    const stop = () => window.clearInterval(timer)
    const start = () => {
      stop()
      timer = window.setInterval(() => emblaApi.scrollNext(), AUTOPLAY_MS)
    }

    const root = emblaApi.rootNode()
    root.addEventListener('mouseenter', stop)
    root.addEventListener('mouseleave', start)
    emblaApi.on('pointerDown', stop)
    emblaApi.on('pointerUp', start)
    start()

    return () => {
      stop()
      root.removeEventListener('mouseenter', stop)
      root.removeEventListener('mouseleave', start)
      emblaApi.off('pointerDown', stop)
      emblaApi.off('pointerUp', start)
    }
  }, [emblaApi])

  return (
    <section aria-roledescription="carousel" aria-label={t.nav.home}>
      <div className="mx-auto max-w-page px-4 pt-4 sm:px-6 lg:px-10">
        <div className="overflow-hidden rounded-3xl" ref={emblaRef}>
          <div className="flex">
            {SLIDES.map((slide, index) => {
              const copy = t.hero.slides[index]

              return (
                <div
                  className="min-w-0 shrink-0 grow-0 basis-full"
                  key={slide.image}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} / ${SLIDES.length}`}
                >
                  <div className={cn('relative overflow-hidden', slide.tint)}>
                    <DotGrid className={cn('top-6 left-6 opacity-60', slide.dots)} />
                    <DotGrid
                      className={cn('right-8 bottom-8 opacity-50', slide.dots)}
                    />

                    <div className="relative grid items-center gap-8 px-6 py-12 sm:px-10 sm:py-16 lg:grid-cols-2 lg:gap-6 lg:px-16 lg:py-20">
                      {/* Copy */}
                      <div className="max-w-lg">
                        <p className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-white uppercase backdrop-blur">
                          {copy.label}
                        </p>
                        <h1 className="mt-5 text-display-sm text-white sm:text-display lg:text-display-lg">
                          {copy.title}
                          <span className="block text-white/70">{copy.highlight}</span>
                        </h1>
                        <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/75 sm:text-base">
                          {copy.subtitle}
                        </p>
                        <Link
                          href={slide.href}
                          className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold tracking-wide text-slate-900 uppercase shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-white/50 focus-visible:outline-none"
                        >
                          {copy.cta}
                          <ArrowRight className="size-4" />
                        </Link>
                      </div>

                      {/* Artwork */}
                      <div className="relative flex items-center justify-center">
                        <span
                          aria-hidden="true"
                          className={cn(
                            'absolute aspect-square w-[92%] max-w-md rounded-full blur-2xl',
                            slide.circle,
                          )}
                        />
                        <img
                          src={slide.image}
                          alt={slide.alt}
                          loading={index === 0 ? 'eager' : 'lazy'}
                          className="relative aspect-4/5 w-4/5 max-w-xs rounded-2xl object-cover shadow-2xl sm:max-w-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex justify-center gap-2 py-5">
          {SLIDES.map((slide, index) => (
            <button
              key={slide.image}
              onClick={() => emblaApi?.scrollTo(index)}
              aria-label={`${t.hero.goToSlide} ${index + 1}`}
              aria-current={index === selectedIndex}
              className={cn(
                'h-1.5 rounded-full transition-all',
                index === selectedIndex
                  ? 'w-7 bg-primary'
                  : 'w-4 bg-foreground/20 hover:bg-foreground/40',
              )}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
