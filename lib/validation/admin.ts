import { z } from 'zod'
import {
  hexColorSchema,
  imageSchema,
  localizedSchema,
  moneySchema,
} from '@/lib/validation/shared'

/**
 * One colourway. `hex` is optional — absent, null and '' all mean "no swatch
 * yet" and all normalise to the key being omitted, so nothing downstream has to
 * tell them apart when deciding whether a product can render swatches.
 *
 * A stale admin tab open across the deploy will POST the old `{ en, bn }` shape
 * and get "English text is required" from `localizedSchema` seeing `undefined`.
 * Confusing, but loud — and far better than writing the legacy shape back over
 * rows migration 0012 just reshaped.
 */
export const productColorSchema = z.object({
  name: localizedSchema,
  hex: z.preprocess(
    (value) =>
      value === null ||
      value === undefined ||
      (typeof value === 'string' && value.trim() === '')
        ? undefined
        : value,
    hexColorSchema.optional(),
  ),
})

export const roleSchema = z.enum(['customer', 'admin'])

export const orderStatusSchema = z.enum([
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
])

/** An admin's ruling on a booking advance. `advance_pending` is not here —
 *  that is where a booking starts, not somewhere it can be moved back to. */
export const advanceVerdictSchema = z.enum(['advance_paid', 'advance_failed'])

export const userIdSchema = z.number().int().positive()

export const uuidSchema = z.string().uuid()

export const productSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, 'A product ID is required')
    .max(64)
    .regex(/^[A-Za-z0-9_-]+$/, 'Use letters, numbers, hyphens or underscores'),
  name: localizedSchema,
  price: moneySchema,
  oldPrice: moneySchema.nullish().transform((value) => value ?? null),
  image: imageSchema,
  category: z.string().trim().min(1, 'Pick a category').max(64),
  badge: z
    .enum(['new', 'sale'])
    .nullish()
    .transform((value) => value ?? null),
  sizes: z
    .array(z.string().trim().min(1).max(32))
    .max(30)
    .nullish()
    .transform((value) => (value?.length ? value : null)),
  colors: z
    .array(productColorSchema)
    .max(30)
    .nullish()
    .transform((value) => (value?.length ? value : null)),
  /** Per-product selling points. Capped low — this is a scannable list, not prose. */
  highlights: z
    .array(localizedSchema)
    .max(8)
    .nullish()
    .transform((value) => (value?.length ? value : null)),
  /** Extra gallery shots. The primary photo is `image`, above. */
  gallery: z
    .array(imageSchema)
    .max(8)
    .nullish()
    .transform((value) => (value?.length ? value : [])),
  description: localizedSchema.nullish().transform((value) => value ?? null),
  /**
   * Pieces available. On a pre-order row this is the allocation still open —
   * the run the admin decided to take bookings for, counted down as they come.
   */
  stock: z.number().int().min(0).max(1_000_000),
  /** Minimum order quantity. Defaulted so older callers stay valid. */
  moq: z
    .number()
    .int()
    .min(1, 'The minimum is at least 1 piece')
    .max(100_000)
    .nullish()
    .transform((value) => value ?? 1),
  /** Marks the row as upcoming stock, taken on pre-order. */
  preorder: z
    .boolean()
    .nullish()
    .transform((value) => value ?? false),
  /**
   * The ship-from date, as the `YYYY-MM-DD` an `<input type="date">` submits.
   * Kept a plain string rather than coerced to a Date: the column is a `date`,
   * and turning it into an instant here is exactly how a calendar day drifts
   * across a timezone boundary.
   */
  preorderShipsAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a delivery date')
    .nullish()
    .transform((value) => value || null),
  /**
   * Share of the goods value payable up front to hold a booking. Null means the
   * store default; a stored 0 is a real choice — a pre-order on pure
   * cash-on-delivery — so no `superRefine` demands a value here.
   */
  preorderAdvancePct: z
    .number()
    .int()
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot be more than 100%')
    .nullish()
    .transform((value) => value ?? null),
  /**
   * The store's cut of a marketplace listing. Null means the store default;
   * a stored 0 is a real choice — a shop carried at cost — so nothing demands
   * a value here either. Meaningless on a house product, and the form only
   * offers it on a listing that has a seller.
   */
  commissionPct: z
    .number()
    .int()
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot be more than 100%')
    .nullish()
    .transform((value) => value ?? null),
})
  // A pre-order with no date promises nothing, and the storefront card has a
  // "Delivery from" line with nowhere to get a value. Caught here rather than
  // left to render as an em dash on the customer's card.
  .superRefine((data, ctx) => {
    if (data.preorder && !data.preorderShipsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['preorderShipsAt'],
        message: 'A pre-order product needs a delivery date',
      })
    }
  })
