'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export type RevealVariant = 'up' | 'fade' | 'scale'

/**
 * Animates its children in once they scroll into view. The keyframes live in
 * globals.css so they can be disabled wholesale for reduced-motion users, and
 * so the whole site animates from one place instead of a JS animation library.
 */
export function Reveal({
  children,
  delay = 0,
  variant = 'up',
  as: Tag = 'div',
  className,
}: {
  children: React.ReactNode
  /** Stagger, in milliseconds. */
  delay?: number
  variant?: RevealVariant
  /** Render as a different element so Reveal never breaks semantics. */
  as?: 'div' | 'li' | 'section' | 'article'
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)
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
    <Tag
      // One ref type per tag would need a generic; the DOM node is the same.
      ref={ref as React.Ref<never>}
      data-reveal={variant}
      data-revealed={revealed}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
      className={cn(className)}
    >
      {children}
    </Tag>
  )
}
