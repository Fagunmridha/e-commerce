import { z } from 'zod'
import { imageSchema, moneySchema, phoneSchema } from '@/lib/validation/shared'

/**
 * The wholesale application and a seller's own product listings. Unlike the
 * admin schemas these are filled in by the public — the same shape validates on
 * the client (for inline field errors) and again inside the server action, which
 * is the copy that actually counts.
 */

export const BUSINESS_TYPES = [
  'retail_shop',
  'distributor',
  'online_seller',
  'other',
] as const

export type BusinessType = (typeof BUSINESS_TYPES)[number]

/** Optional free text: '' and undefined both collapse to null for the column. */
const optionalText = (max = 200) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => value || null)

const optionalImage = imageSchema.nullish().transform((value) => value || null)

/**
 * Optional phone: '' and undefined both collapse to null, like `optionalText`.
 *
 * `phoneSchema.nullish()` is not enough — it admits null and undefined but not
 * the empty string, which is exactly what an untouched text input submits. The
 * form marks alt phone optional and lets blank through, so without this the
 * server rejects a perfectly good application with "Enter a valid Bangladeshi
 * mobile number" and sends the applicant hunting through the number they *did*
 * fill in correctly.
 */
const optionalPhone = z
  .string()
  .trim()
  .nullish()
  .transform((value) => value || null)
  .pipe(phoneSchema.nullable())

export const wholesaleApplicationSchema = z.object({
  shopName: z
    .string()
    .trim()
    .min(2, 'Your shop or company name is required')
    .max(200),
  businessType: z.enum(BUSINESS_TYPES),
  taxToken: optionalText(80),
  binNumber: optionalText(80),
  tradeLicenseNo: optionalText(80),
  yearsInBusiness: z
    .number()
    .int()
    .min(0)
    .max(200)
    .nullish()
    .transform((value) => value ?? null),

  contactName: z.string().trim().min(2, 'Contact name is required').max(120),
  phone: phoneSchema,
  altPhone: optionalPhone,
  email: z.string().trim().email('Enter a valid email address').max(200),
  website: optionalText(300),

  address: z.string().trim().min(5, 'A full address is required').max(500),
  city: z.string().trim().min(2, 'City is required').max(120),
  district: optionalText(120),
  postcode: optionalText(20),

  // Proof the admin looks at before approving. Optional in the schema so a shop
  // can save progress and a rejected applicant can resubmit without re-picking
  // every file; the admin decides whether what is attached is enough.
  taxTokenImage: optionalImage,
  tradeLicenseImage: optionalImage,
  shopPhoto: optionalImage,

  note: optionalText(2000),
})

export type WholesaleApplicationInput = z.input<
  typeof wholesaleApplicationSchema
>
export type WholesaleApplicationParsed = z.output<
  typeof wholesaleApplicationSchema
>

/**
 * One listing, as an approved seller enters it in their dashboard. Separate
 * from the application on purpose: the application is a one-off vetting step,
 * this is the thing a shop edits every day.
 *
 * Deliberately narrower than the admin `productSchema` — no old price, badge,
 * colours or Bangla name. A seller sets what they sell and what it costs; only
 * the store owner gets to put a "sale" flash on the storefront.
 */
export const sellerProductSchema = z
  .object({
    /** The existing id when editing; absent when creating (the server slugs one). */
    id: z.string().trim().max(120).nullish().transform((value) => value || null),
    name: z.string().trim().min(2, 'Give the product a name').max(200),
    image: imageSchema,
    category: z.string().trim().min(1, 'Pick a category').max(64),
    price: moneySchema.refine((value) => value > 0, 'Set a price above 0'),
    stock: z
      .number()
      .int('Use a whole number of pieces')
      .min(0)
      .max(1_000_000),
    moq: z
      .number()
      .int('Use a whole number of pieces')
      .min(1, 'The minimum is at least 1 piece')
      .max(100_000),
    sizes: z
      .array(z.string().trim().min(1).max(32))
      .max(30)
      .nullish()
      .transform((value) => (value?.length ? value : null)),
    description: optionalText(2000),
  })
  // A minimum above the stock on hand is an unbuyable listing. Zero stock is
  // allowed though — that is how a seller marks something sold out without
  // deleting it.
  .refine((value) => value.stock === 0 || value.moq <= value.stock, {
    message: 'The minimum cannot be more pieces than you have in stock',
    path: ['moq'],
  })

export type SellerProductInput = z.input<typeof sellerProductSchema>

/** Admin-side review actions. */
export const reviewDecisionSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'approved', 'rejected', 'suspended']),
  note: z
    .string()
    .trim()
    .max(1000)
    .nullish()
    .transform((value) => value || null),
})

export type ReviewDecisionInput = z.input<typeof reviewDecisionSchema>
