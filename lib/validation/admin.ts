import { z } from 'zod'
import { imageSchema, localizedSchema, moneySchema } from '@/lib/validation/shared'

export const roleSchema = z.enum(['customer', 'admin'])

export const orderStatusSchema = z.enum([
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
])

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
    .array(localizedSchema)
    .max(30)
    .nullish()
    .transform((value) => (value?.length ? value : null)),
  description: localizedSchema.nullish().transform((value) => value ?? null),
  stock: z.number().int().min(0).max(1_000_000),
})
