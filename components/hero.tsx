'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import useEmblaCarousel from 'embla-carousel-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'

/** Slide artwork is language-independent; the copy comes from the dictionary. */
const SLIDE_MEDIA = [
  {
    href: '/shop',
    image:
      'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1200&h=900&fit=crop',
    alt: 'A rail of neatly hung shirts and jackets beside potted plants',
  },
  {
    href: '/shop',
    image:
      'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&h=900&fit=crop',
    alt: 'A bright boutique interior with folded clothing on display',
  },
  {
    href: '/kids',
    image:
      'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=1200&h=900&fit=crop',
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

  return (
    <section className="bg-muted/60" aria-label={t.sections.topCategories}>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {SLIDE_MEDIA.map((media, index) => {
            const slide = t.hero.slides[index]

            return (
              <div className="min-w-0 shrink-0 grow-0 basis-full" key={media.image}>
                <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-20">
                  <div className="max-w-lg">
                    <p className="text-sm font-semibold text-primary">
                      {slide.label}
                    </p>
                    <h1 className="mt-3 text-3xl leading-tight font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                      {slide.title}
                      <span className="block">{slide.highlight}</span>
                    </h1>
                    <p className="mt-4 text-base text-muted-foreground">
                      {slide.subtitle}
                    </p>
                    <Button asChild size="lg" className="mt-7">
                      <Link href={media.href}>{slide.cta}</Link>
                    </Button>
                  </div>

                  <div className="overflow-hidden rounded-xl lg:rounded-2xl">
                    <img
                      src={media.image}
                      alt={media.alt}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      className="aspect-4/3 w-full object-cover"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex justify-center gap-2 pb-6">
        {SLIDE_MEDIA.map((media, index) => (
          <button
            key={media.image}
            onClick={() => emblaApi?.scrollTo(index)}
            aria-label={`${t.hero.goToSlide} ${index + 1}`}
            aria-current={index === selectedIndex}
            className={cn(
              'h-2 rounded-full transition-all',
              index === selectedIndex
                ? 'w-6 bg-primary'
                : 'w-2 bg-foreground/20 hover:bg-foreground/40',
            )}
          />
        ))}
      </div>
    </section>
  )
}
