'use client'

import { cn } from '@/lib/utils'
import type { ProductColor } from '@/lib/types'

/**
 * A circular colour swatch, shared by the three colour pickers (product detail,
 * landing page, quick view) so the accessibility details are written once.
 *
 * `aria-label` is mandatory: a bare coloured circle has no accessible name, and
 * a screen-reader user gets nothing at all from a hex value.
 */
export function ColorSwatch({
  hex,
  label,
  selected,
  onSelect,
}: {
  hex: string
  label: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      title={label}
      aria-label={label}
      aria-pressed={selected}
      className="grid size-11 place-items-center rounded-full focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <span
        className={cn(
          // The hairline border keeps #ffffff / #fffff0 / #f5f0e1 visible
          // instead of vanishing into the card behind them.
          'block size-7 rounded-full border border-black/10',
          selected &&
            'ring-2 ring-foreground ring-offset-2 ring-offset-background',
        )}
        style={{ backgroundColor: hex }}
      />
    </button>
  )
}

/**
 * True when every colourway has a hex, which is the only case where swatches
 * should render.
 *
 * All-or-nothing on purpose: a row mixing circles and text pills reads as
 * broken, and a half-filled product is the normal state while an admin works
 * through the catalogue adding hex values.
 */
export function isSwatchable(
  colors: ProductColor[] | undefined,
): colors is (ProductColor & { hex: string })[] {
  return Boolean(colors?.length) && colors!.every((color) => color.hex)
}
