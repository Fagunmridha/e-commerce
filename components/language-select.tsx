'use client'

import { ChevronDown, Globe } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { LOCALES, LOCALE_LABELS, type Locale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function LanguageSelect({
  /** `inverted` styles it for the dark announcement bar. */
  tone = 'default',
  className,
}: {
  tone?: 'default' | 'inverted'
  className?: string
}) {
  const { locale, setLocale, t } = useLanguage()
  const inverted = tone === 'inverted'

  return (
    <div className={cn('relative flex items-center', className)}>
      <Globe
        className={cn(
          'pointer-events-none absolute left-2 size-3.5',
          inverted ? 'text-background/70' : 'text-muted-foreground',
        )}
      />
      <label className="sr-only" htmlFor={`language-select-${tone}`}>
        {t.header.language}
      </label>
      <select
        id={`language-select-${tone}`}
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        className={cn(
          'cursor-pointer appearance-none rounded-full border py-1 pr-6 pl-7 font-medium transition-colors outline-none focus-visible:ring-[3px]',
          inverted
            ? 'h-7 border-white/15 bg-transparent text-xs text-background hover:border-white/40 focus-visible:ring-white/40'
            : 'h-9 border-border bg-background text-sm text-foreground hover:border-primary focus-visible:ring-ring/50',
        )}
      >
        {LOCALES.map((item) => (
          <option key={item} value={item} className="text-foreground">
            {LOCALE_LABELS[item]}
          </option>
        ))}
      </select>
      <ChevronDown
        className={cn(
          'pointer-events-none absolute right-2 size-3',
          inverted ? 'text-background/70' : 'text-muted-foreground',
        )}
      />
    </div>
  )
}
