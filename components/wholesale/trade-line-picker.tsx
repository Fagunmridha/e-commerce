'use client'

import Image from 'next/image'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/types'

/**
 * Which trade line this shop deals in — the step between choosing the seller
 * side and filling in the application.
 *
 * Cards rather than a `<select>` inside the form, deliberately. This is the
 * decision the whole application hangs off: it fixes what the shop may ever
 * list, and an admin only ever moves it by hand afterwards. A dropdown among a
 * dozen other fields reads as one more detail; a screen of its own reads as the
 * choice it is — and it matches the buyer/seller cards the applicant has just
 * come from, so the two steps feel like one path.
 *
 * Every line is drawn from `categories` where `parent_slug is null`, so a line
 * an admin adds tomorrow appears here with nothing rebuilt. The category's own
 * image is the card's face, which is the same picture the storefront tile uses.
 *
 * One choice, not several: a shop is approved for one line and lists inside it.
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

  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-balance text-foreground sm:text-3xl">
          {copy.title}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          {copy.subtitle}
        </p>
      </div>

      {lines.length === 0 ? (
        // Nothing to pick means an admin has not opened any line to trade yet.
        // Saying so beats an empty grid that reads as a page that failed.
        <div className="rounded-2xl border border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">{copy.empty}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lines.map((line) => {
            const selected = value === line.slug
            return (
              <button
                key={line.slug}
                type="button"
                onClick={() => onChange(line.slug)}
                aria-pressed={selected}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border text-left transition-shadow duration-200',
                  selected
                    ? 'border-primary ring-2 ring-primary/40'
                    : 'border-border hover:shadow-md',
                )}
              >
                <div className="relative aspect-[16/9] bg-muted">
                  <Image
                    src={line.image || '/placeholder.svg'}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                  {selected && (
                    <span className="absolute right-3 top-3 grid size-7 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-4" aria-hidden="true" />
                    </span>
                  )}
                </div>
                <div className="px-5 py-4">
                  <p className="font-semibold text-foreground">
                    {pick(line.name)}
                  </p>
                  {/* The other language under the name, as on the join cards —
                      a shopkeeper reading in Bangla still recognises the
                      English the admin console uses. */}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {line.name.en === pick(line.name)
                      ? line.name.bn
                      : line.name.en}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <div className="mt-8 flex flex-col items-center gap-3">
        <Button size="lg" disabled={!value} onClick={onContinue}>
          {copy.continue}
        </Button>
        <p className="text-xs text-muted-foreground">{copy.hint}</p>
      </div>
    </div>
  )
}
