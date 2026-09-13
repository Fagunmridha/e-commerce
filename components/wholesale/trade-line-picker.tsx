'use client'

import Image from 'next/image'
import { ArrowRight, Check, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/types'

/**
 * `/placeholder.svg` is what the whole codebase uses to mean "no picture", and
 * a category's `image` column is NOT NULL — so most rows carry it rather than
 * a photograph. Treating it as absent is what keeps this grid from being a wall
 * of identical grey boxes, which is exactly what it was.
 */
function hasPhoto(image: string): boolean {
  return Boolean(image) && !image.endsWith('/placeholder.svg')
}

/**
 * Tints for the fallback icon, cycled by position so the lines without a
 * photograph still read as four distinct things rather than four grey squares.
 *
 * A fixed list rather than a colour hashed from the slug: a hash lands wherever
 * it lands, and these four are picked to sit together. Cycling by index means
 * the fifth line reuses the first, which is fine — they are labels, not a key.
 */
const FALLBACK_TONES = [
  'bg-primary/12 text-primary',
  'bg-accent-warm text-accent-warm-foreground',
  'bg-emerald-500/12 text-emerald-700',
  'bg-sky-500/12 text-sky-700',
] as const

/**
 * Which trade line this shop deals in — the step between choosing the seller
 * side and filling in the application.
 *
 * Cards rather than a `<select>` inside the form, deliberately. This is the
 * decision the whole application hangs off: it fixes what the shop may ever
 * list, and an admin only ever moves it by hand afterwards. A dropdown among a
 * dozen other fields reads as one more detail; a screen of its own reads as the
 * choice it is.
 *
 * The cards are compact — a thumbnail beside a name, not a banner above one.
 * A full-bleed image per card looked right against seeded data and collapsed
 * against real data, where three lines in four have no photograph: four
 * placeholder rectangles filling the viewport, and the names themselves pushed
 * below the fold. A row of names with a picture where one exists survives both.
 *
 * Every line is drawn from `categories` where `parent_slug is null`, in the
 * admin's own `position` order, so a line added tomorrow appears here with
 * nothing rebuilt. One choice, not several: a shop is approved for one line.
 *
 * The heading belongs to the page's hero, not to this — see `WholesaleContent`.
 */
export function TradeLinePicker({
  lines,
  value,
  onChange,
  onContinue,
}: {
  lines: Category[]
  /** The slug currently picked, or '' before anything is. */
  value: string
  onChange: (slug: string) => void
  onContinue: () => void
}) {
  const { t, pick } = useLanguage()
  const copy = t.wholesale.linePicker
  const chosen = lines.find((line) => line.slug === value)

  if (lines.length === 0) {
    // Nothing to pick means an admin has not opened any line to trade yet.
    // Saying so beats an empty grid that reads as a page that failed.
    return (
      <div className="rounded-2xl border border-border p-10 text-center">
        <p className="text-sm text-muted-foreground">{copy.empty}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {lines.map((line, index) => {
          const selected = value === line.slug
          const name = pick(line.name)
          // The other language under the name. Identical strings — an admin who
          // filled in only English — would print twice, so one is enough then.
          const alt = name === line.name.en ? line.name.bn : line.name.en

          return (
            <button
              key={line.slug}
              type="button"
              onClick={() => onChange(line.slug)}
              aria-pressed={selected}
              className={cn(
                'flex items-center gap-4 rounded-xl border p-4 text-left transition-colors',
                selected
                  ? 'border-primary bg-accent/60 ring-1 ring-primary/40'
                  : 'border-border bg-background hover:border-primary/40 hover:bg-muted/50',
              )}
            >
              <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                {hasPhoto(line.image) ? (
                  <Image
                    src={line.image}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <span
                    className={cn(
                      'grid size-full place-items-center',
                      FALLBACK_TONES[index % FALLBACK_TONES.length],
                    )}
                  >
                    <Layers className="size-6" aria-hidden="true" />
                  </span>
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-foreground">
                  {name}
                </span>
                {alt !== name && (
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {alt}
                  </span>
                )}
              </span>

              {/* The tick occupies its slot whether or not it is lit, so
                  picking a card does not shift the name beside it. */}
              <span
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-full border',
                  selected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border',
                )}
              >
                {selected && <Check className="size-3.5" aria-hidden="true" />}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-8 flex flex-col items-center gap-2 border-t border-border pt-8">
        <Button size="lg" disabled={!value} onClick={onContinue}>
          {copy.continue}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
        <p className="text-xs text-muted-foreground">
          {chosen ? `${copy.chosen}: ${pick(chosen.name)}` : copy.hint}
        </p>
      </div>
    </div>
  )
}
