/** The rule every category and catalogue slug must satisfy — mirrors the server. */
export const SLUG_PATTERN = /^[a-z0-9-]+$/

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

/**
 * What a slug field does with a keystroke: lower-case, and a space becomes a
 * hyphen instead of an error the admin only meets on submit. Anything else
 * invalid is left in place so the field can say what is wrong.
 */
export function slugInput(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '-')
}
