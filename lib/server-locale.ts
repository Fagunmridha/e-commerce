import { cookies } from 'next/headers'
import { getDictionary, type Dictionary } from '@/lib/dictionaries'
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from '@/lib/i18n'

/** The language saved by the picker — for server components and metadata. */
export async function getServerLocale(): Promise<Locale> {
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value
  return isLocale(stored) ? stored : DEFAULT_LOCALE
}

export async function getServerDictionary(): Promise<Dictionary> {
  return getDictionary(await getServerLocale())
}
