import { cookies, headers } from 'next/headers'
import { getDictionary, type Dictionary } from '@/lib/dictionaries'
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  PATHNAME_HEADER,
  WHOLESALE_DEFAULT_LOCALE,
  WHOLESALE_LOCALE_COOKIE,
  isLocale,
  localeScope,
  type Locale,
} from '@/lib/i18n'

/**
 * Both locales at once — the site's and the wholesale section's.
 *
 * The root layout needs the pair rather than just the active one: it renders
 * once and stays mounted across client navigation, so the provider has to
 * carry both and switch between them as the route changes. Resolving only the
 * current scope would leave the other side to be guessed on the client, and
 * the first paint after crossing into /wholesale would flash the wrong
 * language.
 */
export async function getServerLocales(): Promise<{
  site: Locale
  wholesale: Locale
}> {
  const store = await cookies()
  const site = store.get(LOCALE_COOKIE)?.value
  const wholesale = store.get(WHOLESALE_LOCALE_COOKIE)?.value

  return {
    site: isLocale(site) ? site : DEFAULT_LOCALE,
    // Absent means the viewer has never chosen a language *in this section*,
    // which is exactly when the Bangla default applies.
    wholesale: isLocale(wholesale) ? wholesale : WHOLESALE_DEFAULT_LOCALE,
  }
}

/**
 * The language this request should render in — for server components and
 * metadata.
 *
 * Scoped by path: /wholesale and everything under it read their own cookie and
 * fall back to Bangla, the rest of the store reads the site cookie and falls
 * back to English. The pathname comes from the header `middleware.ts` sets;
 * if it is missing (a route the matcher skips) this degrades to the site
 * scope, which is the safe half — an English fallback on a wholesale page is
 * merely the old behaviour, where the reverse would be a surprise.
 */
export async function getServerLocale(): Promise<Locale> {
  const [locales, headerList] = await Promise.all([
    getServerLocales(),
    headers(),
  ])

  return localeScope(headerList.get(PATHNAME_HEADER) ?? '') === 'wholesale'
    ? locales.wholesale
    : locales.site
}

export async function getServerDictionary(): Promise<Dictionary> {
  return getDictionary(await getServerLocale())
}
