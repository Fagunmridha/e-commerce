import { z } from 'zod'
import {
  dateSchema,
  moneySchema,
  optionalLocalizedSchema,
} from '@/lib/validation/shared'

export const couponSchema = z
  .object({
    id: z.string().uuid().optional(),
    code: z
      .string()
      .trim()
      .min(3, 'Codes need at least 3 characters')
      .max(40)
      .regex(/^[A-Za-z0-9_-]+$/, 'Use letters, numbers, hyphens or underscores')
      .transform((value) => value.toUpperCase()),
    description: optionalLocalizedSchema,
    type: z.enum(['percent', 'fixed']),
    value: moneySchema.refine((value) => value > 0, 'The discount must be above 0'),
    minOrder: moneySchema,
    maxDiscount: moneySchema.nullish().transform((value) => value ?? null),
    startsAt: dateSchema,
    endsAt: dateSchema,
    usageLimit: z
      .number()
      .int()
      .min(1, 'A limit of 0 would make the coupon unusable — leave it blank instead')
      .max(1_000_000)
      .nullish()
      .transform((value) => value ?? null),
    active: z.boolean(),
    featured: z.boolean(),
  })
  .refine(
    (value) => value.type !== 'percent' || value.value <= 100,
    { message: 'A percentage cannot exceed 100', path: ['value'] },
  )
  .refine(
    (value) => !value.startsAt || !value.endsAt || value.startsAt < value.endsAt,
    { message: 'The end date must come after the start date', path: ['endsAt'] },
  )
  .refine((value) => value.type === 'percent' || value.maxDiscount === null, {
    message: 'A cap only applies to percentage coupons',
    path: ['maxDiscount'],
  })

export type CouponInput = z.input<typeof couponSchema>
