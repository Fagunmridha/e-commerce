export const LOCALES = ['en', 'bn'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

/**
 * The wholesale section opens in Bangla while the rest of the store opens in
 * English. Its audience is Bangladeshi shopkeepers rather than the retail
 * shoppers everything else is written for, and a trade application in a second
 * language is a real barrier where a product page is not.
 *
 * A different *default*, not a lock: a viewer can switch it, and their choice
 * sticks — in that section only, so flipping the market to English does not
 * quietly turn the whole storefront over with it.
 */
export const WHOLESALE_DEFAULT_LOCALE: Locale = 'bn'

/** Read on the server in the root layout, written on the client by the picker. */
export const LOCALE_COOKIE = 'cp_locale'

/**
 * The wholesale section's own choice, kept apart from `LOCALE_COOKIE` so the
 * two scopes cannot overwrite each other. Absent means "never chosen here",
 * which is what makes the Bangla default possible at all — one shared cookie
 * could not tell an untouched visit from a deliberate switch to English.
 */
export const WHOLESALE_LOCALE_COOKIE = 'cp_locale_ws'

/**
 * Where `middleware.ts` puts the request's pathname for server components to
 * read. Next gives a server component no other way to learn its own URL, and
 * the locale default depends on which section the request is in.
 */
export const PATHNAME_HEADER = 'x-pathname'

/** Which of the two locale scopes a path belongs to. */
export type LocaleScope = 'site' | 'wholesale'

export function localeScope(pathname: string): LocaleScope {
  // Exact match as well as the prefix: /wholesale itself is in the section,
  // and `startsWith('/wholesale/')` alone would miss it. Anchored with the
  // trailing slash so a future /wholesalers route is not swept in.
  return pathname === '/wholesale' || pathname.startsWith('/wholesale/')
    ? 'wholesale'
    : 'site'
}

export function defaultLocaleFor(scope: LocaleScope): Locale {
  return scope === 'wholesale' ? WHOLESALE_DEFAULT_LOCALE : DEFAULT_LOCALE
}

export function localeCookieFor(scope: LocaleScope): string {
  return scope === 'wholesale' ? WHOLESALE_LOCALE_COOKIE : LOCALE_COOKIE
}

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  bn: 'বাংলা',
}

/** A string that exists in both languages — used for product and category names. */
export type Localized = Record<Locale, string>

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && LOCALES.includes(value as Locale)
}
