import { z } from 'zod'
import { uuidSchema } from '@/lib/validation/admin'

/**
 * Both halves of the review flow — what a customer may submit, and what an
 * admin may decide about it — because they describe the same table.
 *
 * Note the name `reviewModerationSchema` below rather than the obvious
 * `reviewDecisionSchema`: `lib/validation/wholesalers.ts` already exports that
 * name, meaning "a decision about a wholesale application". In a codebase where
 * "review" now has two senses, two similarly-named imports would be a trap.
 */

export const reviewStatusSchema = z.enum(['pending', 'approved', 'rejected'])

export const submitReviewSchema = z.object({
  // Same shape as `productSchema.id` — product ids are admin-typed slugs, not
  // uuids, so this cannot reuse `uuidSchema`.
  productId: z
    .string()
    .trim()
    .min(1, 'Product is required')
    .max(64)
    .regex(/^[A-Za-z0-9_-]+$/, 'That product does not exist'),
  /**
   * `.int()` rather than the old `Math.round`: the star picker only ever emits
   * 1–5, so a request carrying `4.7` is hand-rolled and should be rejected
   * rather than quietly rounded into something the customer never chose.
   */
  rating: z
    .number()
    .int('Pick a star rating')
    .min(1, 'Pick a star rating')
    .max(5, 'Pick a star rating'),
  body: z
    .string()
    .trim()
    .min(3, 'Write a few words about the product')
    .max(2000, 'Keep your review under 2000 characters'),
})

export type SubmitReviewInput = z.input<typeof submitReviewSchema>

export const reviewModerationSchema = z.object({
  id: uuidSchema,
  status: reviewStatusSchema,
  note: z
    .string()
    .trim()
    .max(1000)
    .nullish()
    .transform((value) => value || null),
})

export type ReviewModerationInput = z.input<typeof reviewModerationSchema>

export const bulkReviewStatusSchema = z.object({
  // Capped so one request cannot rewrite the whole table.
  ids: z
    .array(uuidSchema)
    .min(1, 'Select at least one review')
    .max(200, 'Select at most 200 reviews at a time'),
  status: reviewStatusSchema,
})

export type BulkReviewStatusInput = z.input<typeof bulkReviewStatusSchema>

export const featureReviewSchema = z.object({
  id: uuidSchema,
  featured: z.boolean(),
})

export type FeatureReviewInput = z.input<typeof featureReviewSchema>
