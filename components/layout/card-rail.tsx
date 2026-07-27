'use client'

import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Shared carousel behaviour for every card section. Built on embla (already a
 * dependency) so touch dragging, keyboard focus and RTL all come for free.
 *
 * The hook is split from the arrows so a section can host its arrows up in the
 * SectionHeading while the track itself renders below.
 */
export function useCardRail() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    // One card at a time on phones, a full page of cards on desktop.
    slidesToScroll: 'auto',
  })
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const [snaps, setSnaps] = useState<number[]>([])
  const [selected, setSelected] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCanPrev(emblaApi.canScrollPrev())
    setCanNext(emblaApi.canScrollNext())
    setSelected(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    const onReInit = () => {
      setSnaps(emblaApi.scrollSnapList())
      onSelect()
    }

    onReInit()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onReInit)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onReInit)
    }
  }, [emblaApi, onSelect])

  return {
    emblaRef,
    canPrev,
    canNext,
    snaps,
    selected,
    scrollPrev: useCallback(() => emblaApi?.scrollPrev(), [emblaApi]),
    scrollNext: useCallback(() => emblaApi?.scrollNext(), [emblaApi]),
    scrollTo: useCallback(
      (index: number) => emblaApi?.scrollTo(index),
      [emblaApi],
    ),
  }
}

/**
 * Circular prev/next buttons that float over the rail's edges. Pointer-device
 * only — on touch the rail is dragged, and the dots below page it.
 */
export function RailEdgeArrows({
  rail,
  prevLabel,
  nextLabel,
}: {
  rail: CardRail
  prevLabel: string
  nextLabel: string
}) {
  const base =
    'absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-background text-foreground shadow-card-hover transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-0 lg:grid'

  return (
    <>
      <button
        type="button"
        onClick={rail.scrollPrev}
        disabled={!rail.canPrev}
        aria-label={prevLabel}
        className={cn(base, '-left-5')}
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        onClick={rail.scrollNext}
        disabled={!rail.canNext}
        aria-label={nextLabel}
        className={cn(base, '-right-5')}
      >
        <ChevronRight className="size-5" />
      </button>
    </>
  )
}

/** Page dots for a rail. Hidden when everything already fits on one page. */
export function RailDots({
  rail,
  label,
  className,
}: {
  rail: CardRail
  label: string
  className?: string
}) {
  if (rail.snaps.length < 2) return null

  return (
    <div
      className={cn('flex items-center justify-center gap-2', className)}
      role="tablist"
      aria-label={label}
    >
      {rail.snaps.map((_, index) => (
        <button
          key={index}
          type="button"
          role="tab"
          aria-label={`${label} ${index + 1}`}
          aria-selected={index === rail.selected}
          onClick={() => rail.scrollTo(index)}
          className={cn(
            'h-2 rounded-full transition-all duration-300 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
            index === rail.selected
              ? 'w-5 bg-primary'
              : 'w-2 bg-border hover:bg-muted-foreground/50',
          )}
        />
      ))}
    </div>
  )
}

export type CardRail = ReturnType<typeof useCardRail>

/**
 * Prev/next arrows for a rail. Hidden from assistive tech on touch layouts
 * because dragging is the primary affordance there — the buttons are a
 * pointer-device convenience.
 */
export function RailArrows({
  rail,
  prevLabel,
  nextLabel,
  className,
}: {
  rail: CardRail
  prevLabel: string
  nextLabel: string
  className?: string
}) {
  const base =
    'grid size-11 place-items-center rounded-full border border-border bg-background text-foreground transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-35'

  return (
    <div className={cn('hidden items-center gap-2 sm:flex', className)}>
      <button
        type="button"
        onClick={rail.scrollPrev}
        disabled={!rail.canPrev}
        aria-label={prevLabel}
        className={base}
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        onClick={rail.scrollNext}
        disabled={!rail.canNext}
        aria-label={nextLabel}
        className={base}
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  )
}

/**
 * The rail track. `itemClassName` sets how many cards are visible per
 * breakpoint — e.g. `basis-[78%] sm:basis-1/2 lg:basis-1/4`.
 */
export function RailTrack({
  rail,
  label,
  children,
  className,
}: {
  rail: CardRail
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      ref={rail.emblaRef}
      // A carousel of links: the region is labelled and scrollable by keyboard.
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      className={cn('overflow-hidden', className)}
    >
      {/* Negative gutter + per-slide padding keeps gaps even at every basis. */}
      <div className="-ml-4 flex touch-pan-y lg:-ml-5">{children}</div>
    </div>
  )
}

export function RailItem({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('min-w-0 shrink-0 grow-0 pl-4 lg:pl-5', className)}>
      {children}
    </div>
  )
}
