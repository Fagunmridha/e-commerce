'use client'

import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/** How many grid columns a rail collapses to below the `sm` breakpoint. */
export type RailGridCols = 2 | 4

/**
 * Shared carousel behaviour for every card section. Built on embla (already a
 * dependency) so touch dragging, keyboard focus and RTL all come for free.
 *
 * The hook is split from the arrows so a section can host its arrows up in the
 * SectionHeading while the track itself renders below.
 *
 * Pass `gridBelowSm` to turn the rail into a plain CSS grid on phones. Embla is
 * handed `active: false` with an `sm` breakpoint override, so below 640px it
 * never installs a transform and the slides lay out as ordinary grid children;
 * at 640px and up it re-initialises itself and the carousel behaves as before.
 * Rendering one markup tree this way avoids the duplicate DOM (and duplicate
 * image requests) a `useMediaQuery` swap would cost.
 */
export function useCardRail(options?: { gridBelowSm?: RailGridCols }) {
  const gridCols = options?.gridBelowSm ?? null

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    // One card at a time on phones, a full page of cards on desktop.
    slidesToScroll: 'auto',
    ...(gridCols
      ? {
          active: false,
          breakpoints: { '(min-width: 640px)': { active: true } },
        }
      : null),
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
    gridCols,
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
    'absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-background text-foreground shadow-card-hover transition-colors hover:border-button hover:bg-button hover:text-button-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-0 lg:grid'

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
    'grid size-11 place-items-center rounded-full border border-border bg-background text-foreground transition-all hover:border-button hover:bg-button hover:text-button-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-35'

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
  stagger = false,
}: {
  rail: CardRail
  label: string
  children: React.ReactNode
  className?: string
  /** Cascade the slides in as the section scrolls into view. Off by default —
   *  it only reads as a cascade where several cards are on screen at once. */
  stagger?: boolean
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
      {/* Negative gutter + per-slide padding keeps gaps even at every basis.
          In grid mode a real `gap` does that job below sm instead. */}
      <div
        data-stagger={stagger || undefined}
        className={
          rail.gridCols
            ? cn(
                'grid sm:-ml-4 sm:flex sm:touch-pan-y sm:gap-0 lg:-ml-5',
                rail.gridCols === 4
                  ? 'grid-cols-4 gap-x-3 gap-y-5'
                  : 'grid-cols-2 gap-4',
              )
            : '-ml-4 flex touch-pan-y lg:-ml-5'
        }
      >
        {children}
      </div>
    </div>
  )
}

/**
 * One slide. Pass the `rail` when it was created with `gridBelowSm` so the
 * slide drops its flex sizing on phones and lets the grid place it; the
 * `className` should then only carry `sm:`-and-up `basis-*` values.
 */
export function RailItem({
  rail,
  children,
  className,
}: {
  rail?: CardRail
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        rail?.gridCols
          ? 'min-w-0 sm:shrink-0 sm:grow-0 sm:pl-4 lg:pl-5'
          : 'min-w-0 shrink-0 grow-0 pl-4 lg:pl-5',
        className,
      )}
    >
      {children}
    </div>
  )
}
