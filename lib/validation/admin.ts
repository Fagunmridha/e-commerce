import { z } from 'zod'
import { RESERVED_CATEGORY_SLUGS } from '@/lib/reserved-slugs'
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

/**
 * Shared by categories and catalogues: both carry an admin-set order and an
 * on/off switch, and both forms may leave either out — an older client, or a
 * caller that only means to rename a row — so each falls back to the column
 * default rather than failing the parse.
 */
const treePositionSchema = z
  .number()
  .int()
  .min(0)
  .max(9999)
  .nullish()
  .transform((value) => value ?? 0)

const treeStatusSchema = z
  .enum(['active', 'inactive'])
  .nullish()
  .transform((value) => value ?? 'active')

/**
 * A catalogue as the admin form submits it.
 *
 * The slug is lower-cased on the way in rather than merely validated: it ends
 * up in a query string (`/men?catalogue=jeans`), and "Jeans" and "jeans"
 * resolving to different rows is the kind of thing nobody notices until a link
 * someone shared stops matching anything.
 */
export const categorySchema = z
  .object({
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, 'A category slug is required')
      .max(64)
      .regex(/^[a-z0-9-]+$/, 'Use lower-case letters, numbers or hyphens')
      .refine(
        (value) => !RESERVED_CATEGORY_SLUGS.has(value),
        'That name is already a page on the store — pick another slug',
      ),
    name: localizedSchema,
    image: imageSchema,
    scope: z.enum(['retail', 'wholesale', 'both']),
    /**
     * Empty means the row is a trade line in its own right. Whether the parent
     * exists, and whether it is itself a child, are database questions —
     * `upsertCategory` asks them.
     */
    parentSlug: z
      .string()
      .trim()
      .max(64)
      .nullish()
      .transform((value) => value || null),
    position: treePositionSchema,
    status: treeStatusSchema,
  })
  .refine((data) => data.parentSlug !== data.slug, {
    message: 'A category cannot be its own parent',
    path: ['parentSlug'],
  })

export type CategoryInput = z.infer<typeof categorySchema>

export const catalogueSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'A catalogue slug is required')
    .max(64)
    .regex(/^[a-z0-9-]+$/, 'Use lower-case letters, numbers or hyphens'),
  categorySlug: z.string().trim().min(1, 'Pick a category').max(64),
  name: localizedSchema,
  position: treePositionSchema,
  status: treeStatusSchema,
})

export type CatalogueInput = z.infer<typeof catalogueSchema>

/**
 * An admin's verdict on a marketplace listing.
 *
 * `draft` is absent on purpose: it is where a listing the seller has not
 * submitted would sit, so an admin has no business putting one there — the
 * enum on the column is wider than the set of moves this screen may make.
 *
 * The object-level refine is what makes "rejected" mean something to the person
 * reading it. Every other verdict drops the reason in `reviewProduct` rather
 * than here, because a blank note on an approval is not an error.
 */
export const productVerdictSchema = z
  .object({
    id: z.string().trim().min(1).max(64),
    status: z.enum(['pending', 'approved', 'rejected', 'suspended']),
    reason: z
      .string()
      .trim()
      .max(500)
      .nullish()
      .transform((value) => value || null),
  })
  .refine((data) => data.status !== 'rejected' || Boolean(data.reason), {
    message: 'Say why, so the seller knows what to fix',
    path: ['reason'],
  })

export type ProductVerdictInput = z.infer<typeof productVerdictSchema>

/**
 * An attribute definition as the admin form submits it.
 *
 * `key` is slug-shaped and lower-cased for the same reason a category slug is:
 * it is the stable name every stored answer is read back by, and `RAM` and
 * `ram` resolving to two definitions would split one product's specs in half.
 *
 * The refine is what stops a `select` being saved with nothing to select. Every
 * other type ignores `options` entirely, which is why the check is conditional
 * rather than a `min(1)` on the array.
 */
export const attributeDefinitionSchema = z
  .object({
    id: z.string().uuid().nullish().transform((value) => value || null),
    scopeSlug: z.string().trim().min(1, 'Pick where it applies').max(64),
    key: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, 'A field key is required')
      .max(64)
      .regex(/^[a-z0-9-]+$/, 'Use lower-case letters, numbers or hyphens'),
    label: localizedSchema,
    type: z.enum(['text', 'number', 'select', 'boolean']),
    options: z
      .array(localizedSchema)
      .max(100, 'That is too many options')
      .nullish()
      .transform((value) => value ?? []),
    required: z.boolean().nullish().transform((value) => value ?? false),
    position: treePositionSchema,
    status: treeStatusSchema,
  })
  .refine((data) => data.type !== 'select' || data.options.length > 0, {
    message: 'A choice field needs at least one option',
    path: ['options'],
  })

export type AttributeDefinitionInput = z.infer<typeof attributeDefinitionSchema>

/**
 * A product's answers, as either product form submits them.
 *
 * Values are strings whatever the definition's type is — the column is text and
 * the type is applied around it. Which definitions may be answered is a
 * database question (it depends on the product's category), so it is checked in
 * `attributeWrites`, not here.
 */
export const attributeValuesSchema = z
  .array(
    z.object({
      definitionId: z.string().uuid(),
      value: z.string().trim().max(500),
    }),
  )
  .max(100)
  .nullish()
  .transform((value) => value ?? [])

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
  /**
   * Optional: plenty of stock predates catalogues, and a category need not
   * have any. The *pairing* — that the catalogue belongs to the category —
   * is checked server-side, where the catalogue table is readable.
   */
  catalogue: z
    .string()
    .trim()
    .max(64)
    .nullish()
    .transform((value) => value || null),
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
  /**
   * Answers to the per-category fields from /admin/attributes. Which
   * definitions may be answered depends on the product's category, so that is
   * checked in `attributeWrites` rather than here.
   */
  attributes: attributeValuesSchema,
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
