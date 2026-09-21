import type { Localized } from '@/lib/i18n'

/** The same rule the server enforces — see `wholesaleSlugSchema`. */
export const SLUG_PATTERN = /^[a-z0-9-]+$/

/**
 * The English label of a localised name, falling back to Bangla. The tree is an
 * admin tool, so it names rows the way the admin typed them first.
 */
export function nodeName(
  name: Partial<Localized> | string | null | undefined,
): string {
  if (typeof name === 'string') return name
  return name?.en || name?.bn || ''
}

/**
 * "Men’s Cotton T-Shirt" → "mens-cotton-t-shirt". Accents are folded and
 * anything outside a–z / 0–9 collapses to a single hyphen, so the result always
 * passes `SLUG_PATTERN`. Bangla-only input yields '' — the admin types a slug.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .slice(0, 64)
    .replace(/-+$/, '')
}
