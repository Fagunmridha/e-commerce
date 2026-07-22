import type { Locale } from '@/lib/i18n'

/**
 * Catalogue prices in lib/data are stored in USD. Bangla shoppers see taka,
 * converted at this rate — change it in one place when the rate moves.
 */
export const USD_TO_BDT = 120

/** Free-shipping threshold, quoted in each currency. */
export const FREE_SHIPPING_USD = 100

export function toBdt(usd: number): number {
  return Math.round(usd * USD_TO_BDT)
}

/**
 * `$89.99` in English, `৳10,799` in Bangla. Taka amounts drop the paisa —
 * nobody prices a shirt at ৳10,798.80.
 */
export function formatPrice(usd: number, locale: Locale): string {
  if (locale === 'bn') {
    return `৳${toBdt(usd).toLocaleString('en-US')}`
  }

  return `$${usd.toFixed(2)}`
}
