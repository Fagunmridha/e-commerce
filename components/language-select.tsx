'use client'

import { ChevronDown, Globe } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { LOCALES, LOCALE_LABELS, type Locale } from '@/lib/i18n'

export function LanguageSelect() {
  const { locale, setLocale, t } = useLanguage()

  return (
    <div className="relative flex items-center">
      <Globe className="pointer-events-none absolute left-2 size-4 text-muted-foreground" />
      <label className="sr-only" htmlFor="language-select">
        {t.header.language}
      </label>
      <select
        id="language-select"
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        className="h-9 cursor-pointer appearance-none rounded-md border border-border bg-background py-1 pr-7 pl-7 text-sm font-medium text-foreground transition-colors outline-none hover:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {LOCALES.map((item) => (
          <option key={item} value={item}>
            {LOCALE_LABELS[item]}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 size-3.5 text-muted-foreground" />
    </div>
  )
}
