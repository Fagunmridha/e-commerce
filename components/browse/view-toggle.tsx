'use client'

import { Grid3X3, List } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { cn } from '@/lib/utils'

export type ViewMode = 'grid' | 'list'

/**
 * Grid or list, as a pair of buttons in one bordered well. Shared by `/shop`
 * and the wholesale market so the two cannot drift into different shapes of the
 * same switch.
 *
 * Two buttons rather than one that toggles: a single button has to label itself
 * with the state it would move *to*, which readers consistently read as the
 * state they are in.
 */
export function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode
  onChange: (value: ViewMode) => void
}) {
  const { t } = useLanguage()

  const modes: { mode: ViewMode; Icon: typeof Grid3X3; label: string }[] = [
    { mode: 'grid', Icon: Grid3X3, label: t.shop.viewGrid },
    { mode: 'list', Icon: List, label: t.shop.viewList },
  ]

  return (
    <div className="flex items-center rounded-xl border border-border bg-background p-1">
      {modes.map(({ mode, Icon, label }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          aria-label={label}
          aria-pressed={value === mode}
          className={cn(
            'flex size-8 items-center justify-center rounded-lg transition-colors',
            value === mode
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  )
}
