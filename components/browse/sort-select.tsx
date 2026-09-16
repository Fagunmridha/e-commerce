'use client'

import { useLanguage } from '@/components/language-provider'

export type SortOption<T extends string> = { value: T; label: string }

/**
 * The sort control every product-browsing page shares.
 *
 * A native `<select>` rather than the shadcn one, matching what `/shop` has
 * always used here: the options are a handful of plain strings, and a native
 * select is the control a phone renders as its own picker.
 *
 * The options are passed in rather than built here, because the set differs by
 * page — the wholesale market has no "featured" to sort by, since a marketplace
 * listing cannot carry the store's own badge.
 */
export function SortSelect<T extends string>({
  id,
  value,
  options,
  onChange,
}: {
  /** Needed for the visible label's `htmlFor`; unique per page. */
  id: string
  value: T
  options: SortOption<T>[]
  onChange: (value: T) => void
}) {
  const { t } = useLanguage()

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={id}
        className="hidden shrink-0 text-xs font-medium text-muted-foreground sm:inline"
      >
        {t.shop.sortBy}:
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-medium outline-none focus:ring-2 focus:ring-ring/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
