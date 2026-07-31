/**
 * The stack of shipping cartons in the wholesale card's bottom-right corner.
 *
 * Drawn inline rather than served from /public: next/image refuses SVG without
 * `dangerouslyAllowSVG`, and inlining costs no extra request for a mark this
 * small. Flat isometric facets — no gradients — so it stays crisp at any size.
 */
export function WholesaleBoxes({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 196 148"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {/* Back to front, so each carton overlaps the one behind it. */}
      <Carton x={58} y={74} />
      <Carton x={138} y={74} />
      <Carton x={58} y={30} />
    </svg>
  )
}

/** One carton, drawn from its top-face centre at (x, y). */
function Carton({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* Lid, with the far flap a shade darker to suggest the seam. */}
      <path d="M0 -23 L40 0 L0 23 L-40 0 Z" fill="#E4B681" />
      <path d="M0 -23 L40 0 L0 23 Z" fill="#D6A46B" />

      {/* The two visible walls. */}
      <path d="M-40 0 L0 23 L0 67 L-40 44 Z" fill="#C6924F" />
      <path d="M40 0 L0 23 L0 67 L40 44 Z" fill="#AE7A41" />

      {/* Packing tape, banded across both walls at the same height. */}
      <path d="M-40 12 L0 35 L0 45 L-40 22 Z" fill="#AC7A3E" />
      <path d="M40 12 L0 35 L0 45 L40 22 Z" fill="#976831" />
    </g>
  )
}
