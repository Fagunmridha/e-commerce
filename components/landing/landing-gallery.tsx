'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'

/**
 * The landing page's photo column.
 *
 * Owns its own selection because nothing outside it cares which frame is up —
 * the order form is driven by size, colour and quantity, not by the gallery.
 *
 * `next/image` rather than a bare `<img>`: this page is where paid traffic
 * lands, so the first photo is the LCP element on every visit and it is worth
 * the optimizer's resizing and the explicit `priority`.
 */
export function LandingGallery({
  images,
  name,
}: {
  images: string[]
  name: string
}) {
  const { t } = useLanguage()
  const [selected, setSelected] = useState(0)

  return (
    // Pinned beside the buy box on wide screens: the order form is a tall
    // column, and without this the photo scrolls away and leaves the shopper
    // filling in an address with nothing to look at.
    <div className="space-y-3 md:sticky md:top-24 md:self-start">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
        <Image
          src={images[selected] || '/placeholder.svg'}
          alt={`${name} — ${t.product.view} ${selected + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
          className="object-cover"
        />
      </div>

      {/* A single-photo product gets no strip — one thumbnail under one photo
          is a control that cannot do anything. */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {images.map((image, index) => (
            <button
              key={image + index}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`${t.product.showView} ${index + 1}`}
              aria-current={selected === index}
              className={cn(
                'relative aspect-square overflow-hidden rounded-lg border-2 transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                selected === index
                  ? 'border-primary'
                  : 'border-transparent hover:border-border',
              )}
            >
              <Image
                src={image || '/placeholder.svg'}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
