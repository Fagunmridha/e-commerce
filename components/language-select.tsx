'use client'

import { Globe } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { LOCALES, LOCALE_LABELS } from '@/lib/i18n'
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
  const nextLocale = LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length]

  return (
    <button
      type="button"
      onClick={() => setLocale(nextLocale)}
      aria-label={t.header.language}
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-full border font-medium transition-colors outline-none focus-visible:ring-[3px]',
        inverted
          ? 'h-7 border-white/15 bg-transparent px-3 text-xs text-background hover:border-white/40 focus-visible:ring-white/40'
          : 'h-9 border-border bg-background px-3.5 text-sm text-foreground hover:border-primary focus-visible:ring-ring/50',
        className,
      )}
    >
      <Globe className={cn('size-3.5', inverted ? 'text-background/70' : 'text-muted-foreground')} />
      {LOCALE_LABELS[locale]}
    </button>
  )
}
