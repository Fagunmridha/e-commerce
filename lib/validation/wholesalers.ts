import { z } from 'zod'
import { imageSchema, moneySchema, phoneSchema } from '@/lib/validation/shared'
import { attributeValuesSchema } from '@/lib/validation/admin'

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
  /**
   * The trade lines this shop wants to deal in, picked on the screen before the
   * form. At least one. A list because a shop genuinely trades in several, and
   * because the verdict is per line: an admin grants Clothing and refuses
   * Cosmetics on the same application. What was *granted* lives in
   * `wholesaler_trade_lines`; this is only what was asked for.
   *
   * De-duplicated here so the cap counts distinct lines, and capped so a
   * hand-made request cannot post thousands of rows.
   *
   * Whether each slug exists, and is a line open to trade, cannot be asked
   * here: this schema is shared with the client and has no database.
   * `submitWholesaleApplication` asks.
   */
  categorySlugs: z
    .array(z.string().trim().min(1).max(64))
    .min(1, 'Pick at least one trade line your shop deals in')
    .transform((slugs) => [...new Set(slugs)])
    .refine((slugs) => slugs.length <= 32, 'That is too many trade lines'),
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

  // Proof the admin looks at before approving. All three are optional: a shop
  // can save progress, a rejected applicant can resubmit without re-picking
  // every file, and an applicant who has to go and photograph their storefront
  // is one who abandons the form. The admin decides whether what is attached is
  // enough and chases the rest — approval is the gate, not the upload widget.
  tradeLicenseImage: optionalImage,
  ownerPhoto: optionalImage,
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
 * Narrower than the admin `productSchema` — no sale badge and no separate Bangla
 * name. A seller sets what they sell and what it costs; only the store owner
 * gets to put a "sale" flash on the storefront. The MRP is the seller's to
 * state, because it is a fact about the goods rather than a promotion.
 */
export const sellerProductSchema = z
  .object({
    /** The existing id when editing; absent when creating (the server slugs one). */
    id: z.string().trim().max(120).nullish().transform((value) => value || null),
    name: z.string().trim().min(2, 'Give the product a name').max(200),
    image: imageSchema,
    /**
     * The trade line this listing is filed under — step one of the form, and
     * the first thing the server checks against the shop's grants. Sent
     * explicitly rather than derived from `category`, so the request states
     * every level of the path it claims and each one can be refused on its own.
     */
    tradeLine: z.string().trim().min(1, 'Pick a trade line').max(64),
    category: z.string().trim().min(1, 'Pick a category').max(64),
    /** Optional, and paired against the category server-side — see the admin
     *  schema's note. A seller who leaves it blank still lists under "All". */
    catalogue: z
      .string()
      .trim()
      .max(64)
      .nullish()
      .transform((value) => value || null),
    /** What the buyer pays per piece — the wholesale price. */
    price: moneySchema.refine((value) => value > 0, 'Set a price above 0'),
    /**
     * The retail price (MRP) printed on the goods, optional. Stored in
     * `old_price`, which is what makes a card strike it through beside the
     * wholesale price with the percentage below MRP — the comparison a trade
     * buyer actually makes.
     */
    mrp: moneySchema
      .nullish()
      .transform((value) => (value ? value : null)),
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
    /** Colour names as the seller types them — "Black", "Navy". */
    colors: z
      .array(z.string().trim().min(1).max(40))
      .max(20)
      .nullish()
      .transform((value) => (value?.length ? value : null)),
    /**
     * Send for review (`true`) or keep as a draft (`false`). Defaulted to send,
     * so a client that predates drafts keeps its old behaviour.
     */
    submit: z
      .boolean()
      .nullish()
      .transform((value) => value ?? true),
    /**
     * Answers to the admin-defined fields for this listing's category. Which
     * definitions may be answered depends on that category, which is a database
     * question — `attributeWrites` drops anything that does not apply.
     */
    attributes: attributeValuesSchema,
  })
  // A minimum above the stock on hand is an unbuyable listing. Zero stock is
  // allowed though — that is how a seller marks something sold out without
  // deleting it.
  .refine((value) => value.stock === 0 || value.moq <= value.stock, {
    message: 'The minimum cannot be more pieces than you have in stock',
    path: ['moq'],
  })
  // An MRP below the wholesale price is a typo, and left alone it would print
  // as a card claiming the buyer pays *more* than retail.
  .refine((value) => value.mrp === null || value.mrp >= value.price, {
    message: 'The MRP cannot be lower than the wholesale price',
    path: ['mrp'],
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
