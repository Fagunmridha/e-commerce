'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import useEmblaCarousel from 'embla-carousel-react'
import { ArrowRight } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'

const AUTOPLAY_MS = 2000

/** `crop=faces` keeps people in frame when the photo is cropped to a wide banner. */
const bg = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1920&h=1080&fit=crop&crop=faces,entropy`

/**
 * Artwork per slide; the copy comes from the dictionary, so the order here must
 * match `t.hero.slides`.
 */
const SLIDES = [
  {
    href: '/shop',
    image: bg('1441984904996-e0b6ba687e04'),
    alt: 'A bright boutique interior with racks of clothing',
  },
  {
    href: '/men',
    image: bg('1516257984-b1b4d707412e'),
    alt: "A man wearing pieces from the men's collection",
  },
  {
    href: '/women',
    image: bg('1483985988355-763728e1935b'),
    alt: "A woman wearing pieces from the women's collection",
  },
  {
    href: '/kids',
    image: bg('1519238263530-99bdd11df2ea'),
    alt: 'Children in colourful casual clothing',
  },
]

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
    <section
      className="relative"
      aria-roledescription="carousel"
      aria-label={t.nav.home}
    >
      <div className="overflow-hidden" ref={emblaRef}>
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
                {/* The header is 4rem tall, so this fills exactly the rest of the screen. */}
                <div className="relative flex min-h-[78svh] items-center lg:min-h-[calc(100svh-4rem)]">
                  <img
                    src={slide.image}
                    alt={slide.alt}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    className="absolute inset-0 size-full object-cover"
                  />

                  {/* Scrim: strong on the left where the copy sits, clearer on the right. */}
                  <div className="absolute inset-0 bg-linear-to-r from-black/85 via-black/55 to-black/20" />
                  <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-black/60 to-transparent" />

                  <div className="relative mx-auto w-full max-w-page px-4 py-20 sm:px-6 lg:px-10">
                    <div className="max-w-2xl">
                      <p className="inline-flex items-center rounded-full bg-white/15 px-4 py-1.5 text-[11px] font-bold tracking-[0.2em] text-white uppercase backdrop-blur">
                        {copy.label}
                      </p>
                      <h1 className="mt-6 text-display-sm text-white sm:text-display lg:text-display-lg">
                        {copy.title}
                        <span className="block text-white/75">{copy.highlight}</span>
                      </h1>
                      <p className="mt-6 max-w-md text-sm leading-relaxed text-white/80 sm:text-base">
                        {copy.subtitle}
                      </p>
                      <Link
                        href={slide.href}
                        className="mt-9 inline-flex items-center gap-2 rounded-full bg-white px-9 py-4 text-sm font-bold tracking-wide text-slate-900 uppercase shadow-xl transition-transform hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-white/60 focus-visible:outline-none"
                      >
                        {copy.cta}
                        <ArrowRight className="size-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Dots sit over the image, aligned with the copy above them. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-8">
        <div className="mx-auto flex max-w-page gap-2 px-4 sm:px-6 lg:px-10">
          {SLIDES.map((slide, index) => (
            <button
              key={slide.image}
              onClick={() => emblaApi?.scrollTo(index)}
              aria-label={`${t.hero.goToSlide} ${index + 1}`}
              aria-current={index === selectedIndex}
              className={cn(
                'pointer-events-auto h-1.5 rounded-full transition-all',
                index === selectedIndex
                  ? 'w-10 bg-white'
                  : 'w-5 bg-white/40 hover:bg-white/70',
              )}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
