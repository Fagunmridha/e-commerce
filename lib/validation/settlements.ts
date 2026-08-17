import { z } from 'zod'

/**
 * Schemas for the settlement actions. Same reasoning as every other module in
 * here: a server action is a public HTTP endpoint, and `requireAdmin()` keeps
 * strangers out without stopping a stale client writing nonsense into a column.
 */

export const markPaidSchema = z.object({
  id: z.string().uuid('Not a settlement id'),
  /**
   * How the money actually moved — "bKash TrxID 9F2K…", "cash, 14 Mar". Free
   * text because there is no gateway to ask; the admin's own record is the
   * only evidence there is, and it prints on the seller's copy of the sheet.
   */
  note: z
    .string()
    .trim()
    .max(200, 'Keep the reference under 200 characters')
    .nullish()
    .transform((value) => value || null),
})

export type MarkPaidInput = z.input<typeof markPaidSchema>

/**
 * A "lot" — every settlement delivered between two dates. Stored as plain
 * `YYYY-MM-DD` strings rather than coerced to Dates for the same reason
 * `preorderShipsAt` is: the admin picks calendar days, and turning them into
 * instants here is how a range quietly shifts across a timezone boundary and
 * drops the last day's settlements.
 */
export const statementRangeSchema = z
  .object({
    sellerId: z.string().uuid('Pick a shop'),
    from: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a start date'),
    to: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick an end date'),
  })
  .refine((data) => data.from <= data.to, {
    path: ['to'],
    message: 'The end date cannot be before the start date',
  })

export type StatementRangeInput = z.input<typeof statementRangeSchema>
