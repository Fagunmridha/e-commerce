'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Fades its children up once they scroll into view. The animation itself lives
 * in globals.css so it can be disabled wholesale for reduced-motion users.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  /** Stagger, in milliseconds. */
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // No IntersectionObserver (or an already-visible element): just show it.
    if (typeof IntersectionObserver === 'undefined') {
      setRevealed(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      data-reveal=""
      data-revealed={revealed}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
      className={cn(className)}
    >
      {children}
    </div>
  )
}
