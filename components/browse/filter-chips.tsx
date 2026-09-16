'use client'

import { RotateCcw, X } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

/** One thing currently narrowing the grid, and the way to stop it doing so. */
export type FilterChip = {
  /** Stable across renders — the filter it stands for, not its label. */
  key: string
  label: string
  onClear: () => void
}

/**
 * What is currently filtering the grid, as a row of dismissible chips.
 *
 * Shared by `/shop` and the wholesale market. The chips are built by the
 * caller: which filters a page has, and how each one reads back as a sentence,
 * is the page's business — this owns only how they look and that "clear all"
 * sits at the end of them.
 *
 * Renders nothing when there is nothing active, so a caller can drop it in
 * without guarding.
 */
export function FilterChips({
  chips,
  onClearAll,
}: {
  chips: FilterChip[]
  onClearAll: () => void
}) {
  const { t } = useLanguage()

  if (chips.length === 0) return null

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/40 p-3">
      <span className="text-xs font-bold text-muted-foreground">
        {t.shop.activeFilters}:
      </span>

      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onClear}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium shadow-xs hover:border-foreground/40"
        >
          <span>{chip.label}</span>
          <X className="size-3 text-muted-foreground hover:text-foreground" />
        </button>
      ))}

      <button
        type="button"
        onClick={onClearAll}
        className="ml-auto flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
      >
        <RotateCcw className="size-3" />
        <span>{t.shop.clearAll}</span>
      </button>
    </div>
  )
}
