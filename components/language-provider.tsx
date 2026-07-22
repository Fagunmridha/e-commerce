'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { getDictionary, type Dictionary } from '@/lib/dictionaries'
import { formatPrice } from '@/lib/currency'
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale, type Localized } from '@/lib/i18n'

type LanguageContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  /** The full dictionary for the active locale. */
  t: Dictionary
  /** Pick the active language out of a localized value from lib/data. */
  pick: (value: Localized) => string
  /** Catalogue USD price rendered in the active currency. */
  price: (usd: number) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale
  children: React.ReactNode
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    // Persisted in a cookie so the server can render the right language on the
    // next request — that is what keeps the first paint flash-free.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    document.documentElement.lang = next
  }, [])

  const pick = useCallback((value: Localized) => value[locale], [locale])
  const price = useCallback((usd: number) => formatPrice(usd, locale), [locale])

  return (
    <LanguageContext.Provider
      value={{ locale, setLocale, t: getDictionary(locale), pick, price }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error('useLanguage must be used inside <LanguageProvider>')
  }

  return context
}

export { DEFAULT_LOCALE }
