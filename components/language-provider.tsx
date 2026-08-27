'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getDictionary, type Dictionary } from '@/lib/dictionaries'
import { formatPrice } from '@/lib/currency'
import {
  DEFAULT_LOCALE,
  localeCookieFor,
  localeScope,
  type Locale,
  type LocaleScope,
  type Localized,
} from '@/lib/i18n'

type LanguageContextValue = {
  locale: Locale
  /** Switches the language of the section the viewer is currently in. */
  setLocale: (locale: Locale) => void
  /** Which scope `setLocale` will write — 'site' or 'wholesale'. */
  scope: LocaleScope
  /** The full dictionary for the active locale. */
  t: Dictionary
  /** Pick the active language out of a localized value from lib/data. */
  pick: (value: Localized) => string
  /** A taka amount rendered for display, e.g. `৳1,200`. */
  price: (amount: number) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

/**
 * Language, in two independent scopes.
 *
 * The store runs in English; the wholesale section runs in Bangla. Each keeps
 * its own choice, so a wholesaler who prefers English in the market does not
 * flip the shopper-facing storefront over with it, and vice versa.
 *
 * Both are resolved on the server and handed in as a pair rather than one
 * "current" locale, because this provider lives in the root layout and stays
 * mounted while the viewer navigates between the two sections. It has to be
 * able to answer for whichever scope the route is in *now*, with no round trip
 * and no flash of the wrong language.
 */
export function LanguageProvider({
  siteLocale,
  wholesaleLocale,
  children,
}: {
  siteLocale: Locale
  wholesaleLocale: Locale
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const scope = localeScope(pathname)

  const [locales, setLocales] = useState<Record<LocaleScope, Locale>>({
    site: siteLocale,
    wholesale: wholesaleLocale,
  })

  const locale = locales[scope]

  const setLocale = useCallback(
    (next: Locale) => {
      setLocales((current) => ({ ...current, [scope]: next }))
      // Persisted in a cookie so the server can render the right language on
      // the next request — that is what keeps the first paint flash-free. One
      // cookie per scope, so the two never overwrite each other.
      document.cookie = `${localeCookieFor(scope)}=${next}; path=/; max-age=31536000; samesite=lax`
    },
    [scope],
  )

  // `<html lang>` is written by the server for the first paint, but crossing
  // into or out of /wholesale changes the language without a new document —
  // so the attribute has to be kept honest on the client too, or a screen
  // reader keeps announcing Bangla in an English voice.
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const pick = useCallback((value: Localized) => value[locale], [locale])
  // Currency does not vary by language — the store sells in taka either way —
  // but this stays on the context so call sites keep one import.
  const price = useCallback((amount: number) => formatPrice(amount), [])

  return (
    <LanguageContext.Provider
      value={{ locale, setLocale, scope, t: getDictionary(locale), pick, price }}
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
