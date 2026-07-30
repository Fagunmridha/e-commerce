import { z } from 'zod'

/**
 * Shared primitives for the admin action schemas.
 *
 * Server actions are public HTTP endpoints — `requireAdmin()` keeps strangers
 * out, but it does not stop a stale client (or a hand-rolled request) from
 * writing `NaN` into a `doublePrecision` column or a novel into a `text` one.
 */

/** An en/bn pair. Both languages are required; forms fall back en → bn. */
export const localizedSchema = z.object({
  en: z.string().trim().min(1, 'English text is required').max(500),
  bn: z.string().trim().min(1, 'Bangla text is required').max(500),
})

export const optionalLocalizedSchema = localizedSchema.nullish().transform(
  (value) => value ?? null,
)

/**
 * A link an admin typed that ends up in an `<a href>`. Only same-origin paths
 * and https URLs — `javascript:` here would be stored XSS.
 */
export const linkSchema = z
  .string()
  .trim()
  .min(1, 'Link is required')
  .max(2048)
  .refine(
    (value) => value.startsWith('/') || /^https:\/\//i.test(value),
    'Use a path like /shop or a full https:// URL',
  )

/** An image URL or path. Same reasoning as `linkSchema`, plus local /public files. */
export const imageSchema = z
  .string()
  .trim()
  .min(1, 'An image is required')
  .max(2048)
  .refine(
    (value) => value.startsWith('/') || /^https?:\/\//i.test(value),
    'Image must be a URL or a path under /public',
  )

/**
 * A swatch colour an admin typed. Accepts `#rgb` or `#rrggbb` and normalises to
 * lower-case `#rrggbb`, so there is exactly one stored form.
 *
 * Strict on purpose: the value is interpolated into a `style` attribute, and a
 * typo would render an invisible or default-coloured circle with no error
 * anywhere in the stack.
 */
export const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Use a hex colour like #1f2937')
  .transform((value) => {
    const body = value.slice(1).toLowerCase()
    return `#${body.length === 3 ? [...body].map((char) => char + char).join('') : body}`
  })

/**
 * Bangladeshi mobile: 11 digits starting 013–019, optional +88 prefix.
 * Shared so the checkout form and the wholesale application agree on what a
 * valid number looks like.
 */
export const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/

export const phoneSchema = z
  .string()
  .trim()
  .regex(BD_PHONE, 'Enter a valid Bangladeshi mobile number')

/**
 * Money in taka, matching the `doublePrecision` price columns. The ceiling is
 * one crore — high enough that no real product or coupon hits it, low enough
 * that a fat-fingered extra digit still gets caught.
 */
export const moneySchema = z
  .number()
  .finite('Enter a valid amount')
  .min(0, 'Cannot be negative')
  .max(10_000_000, 'That is above the ৳1,00,00,000 limit')

/** Accepts a `datetime-local` string or null, and normalises to a Date. */
export const dateSchema = z
  .union([z.string().trim(), z.date(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined || value === '') return null
    const date = value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  })

/**
 * Throws the first validation message, which the client surfaces via toast.
 *
 * Generic over the schema rather than over a value type, so the return is the
 * schema's *output* — the `.transform()` steps above (dates, nullish coercion)
 * are what the caller actually receives.
 */
export function parseOrThrow<S extends z.ZodTypeAny>(
  schema: S,
  input: unknown,
): z.output<S> {
  const result = schema.safeParse(input)
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? 'Invalid input')
  }
  return result.data
}
