'use client'

import { useEffect, useState } from 'react'

/**
 * True once the page has scrolled past `enter`, and false again only after it
 * comes back above `exit`. The two thresholds are deliberately apart: a single
 * threshold flips on every pixel of jitter (rubber-banding, the mobile URL bar
 * growing and shrinking), which makes anything driven by this hook flicker.
 *
 * Only cosmetic, non-layout properties should depend on this. Changing the
 * header's height from here shifts everything below it, which Chrome's scroll
 * anchoring then compensates for by moving the scroll position — feeding
 * straight back into this hook and shaking the header.
 */
export function useScrolled(enter = 24, exit = 4) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let frame = 0

    const read = () => {
      frame = 0
      const y = window.scrollY
      setScrolled((was) => (was ? y > exit : y > enter))
    }

    // Scroll fires far faster than paint on mobile; coalesce to one read/frame.
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(read)
    }

    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [enter, exit])

  return scrolled
}
