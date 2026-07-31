'use client'

import { useId } from 'react'

/**
 * The pair of discount tickets in the coupon card's corner. Takes its purple
 * from `currentColor`, so the caller sets the tone with a text colour.
 *
 * Inline rather than a file in /public: next/image will not optimise SVG
 * without `dangerouslyAllowSVG`, and this costs no extra request.
 */
export function CouponTickets({ className }: { className?: string }) {
  // Two instances on one page would otherwise collide on the mask ids.
  const id = useId()
  const backMask = `${id}-back`
  const frontMask = `${id}-front`

  return (
    <svg
      viewBox="0 0 128 104"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        {/* White is kept, black is punched out — so the notches on the short
            edges are real holes and the ticket behind shows through them. */}
        <mask
          id={backMask}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="128"
          height="104"
        >
          <g transform="rotate(-20 45 36)">
            <rect x="10" y="14" width="70" height="44" rx="10" fill="#fff" />
            <circle cx="10" cy="36" r="7.5" fill="#000" />
            <circle cx="80" cy="36" r="7.5" fill="#000" />
          </g>
        </mask>

        <mask
          id={frontMask}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="128"
          height="104"
        >
          <g transform="rotate(-20 75 66)">
            <rect x="40" y="44" width="70" height="44" rx="10" fill="#fff" />
            <circle cx="40" cy="66" r="7.5" fill="#000" />
            <circle cx="110" cy="66" r="7.5" fill="#000" />
          </g>
        </mask>
      </defs>

      <rect
        width="128"
        height="104"
        fill="currentColor"
        opacity="0.45"
        mask={`url(#${backMask})`}
      />
      <rect
        width="128"
        height="104"
        fill="currentColor"
        mask={`url(#${frontMask})`}
      />

      {/* The per-cent mark, tilted with the ticket it sits on. */}
      <g
        transform="rotate(-20 75 66)"
        stroke="#fff"
        strokeWidth="4"
        strokeLinecap="round"
      >
        <circle cx="65" cy="58" r="4.5" />
        <circle cx="85" cy="74" r="4.5" />
        <path d="M88 54 L62 78" />
      </g>
    </svg>
  )
}
