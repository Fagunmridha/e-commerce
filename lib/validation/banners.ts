import { z } from 'zod'
import {
  dateSchema,
  imageSchema,
  linkSchema,
  localizedSchema,
  optionalLocalizedSchema,
} from '@/lib/validation/shared'

export const bannerSchema = z
  .object({
    id: z.string().uuid().optional(),
    slug: z.string().trim().max(120).optional(),
    placement: z.enum(['hero', 'offer', 'announcement']),
    image: imageSchema,
    label: optionalLocalizedSchema,
    title: localizedSchema,
    highlight: optionalLocalizedSchema,
    subtitle: optionalLocalizedSchema,
    ctaLabel: optionalLocalizedSchema,
    ctaHref: linkSchema,
    startsAt: dateSchema,
    endsAt: dateSchema,
    active: z.boolean(),
    sortOrder: z.number().int().min(0).max(999),
  })
  .refine(
    (value) => !value.startsAt || !value.endsAt || value.startsAt < value.endsAt,
    { message: 'The end date must come after the start date', path: ['endsAt'] },
  )

export type BannerInput = z.input<typeof bannerSchema>
export type BannerParsed = z.output<typeof bannerSchema>
