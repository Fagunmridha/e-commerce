export const LOCALES = ['en', 'bn'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

/** Read on the server in the root layout, written on the client by the picker. */
export const LOCALE_COOKIE = 'cp_locale'

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  bn: 'বাংলা',
}

/** A string that exists in both languages — used for product and category names. */
export type Localized = Record<Locale, string>

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && LOCALES.includes(value as Locale)
}
