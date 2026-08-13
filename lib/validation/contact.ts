import { z } from 'zod'
import { uuidSchema } from '@/lib/validation/admin'
import { phoneSchema } from '@/lib/validation/shared'

/**
 * Both halves of the contact flow — what a visitor may send, and what an admin
 * may do with it afterwards.
 *
 * The submit schema is the strict one on purpose: unlike every other write in
 * the app this endpoint is reachable without signing in, so it is the only
 * thing standing between the form and the table.
 */

export const contactStatusSchema = z.enum(['new', 'read', 'replied', 'archived'])

export const submitContactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Please enter your name')
    .max(120, 'That name is too long'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email address')
    .max(254),
  /** Same rule as checkout — this is the number the admin will ring back. */
  phone: phoneSchema,
  subject: z
    .string()
    .trim()
    .min(3, 'Please add a subject')
    .max(200, 'Keep the subject under 200 characters'),
  message: z
    .string()
    .trim()
    .min(10, 'Please write at least 10 characters')
    .max(4000, 'Keep your message under 4000 characters'),
})

export type SubmitContactInput = z.input<typeof submitContactSchema>

export const contactStatusUpdateSchema = z.object({
  id: uuidSchema,
  status: contactStatusSchema,
})

export type ContactStatusUpdateInput = z.input<typeof contactStatusUpdateSchema>

export const bulkContactStatusSchema = z.object({
  // Capped so one request cannot rewrite the whole inbox.
  ids: z
    .array(uuidSchema)
    .min(1, 'Select at least one message')
    .max(200, 'Select at most 200 messages at a time'),
  status: contactStatusSchema,
})

export type BulkContactStatusInput = z.input<typeof bulkContactStatusSchema>

export const contactNoteSchema = z.object({
  id: uuidSchema,
  note: z
    .string()
    .trim()
    .max(1000, 'Keep the note under 1000 characters')
    .nullish()
    .transform((value) => value || null),
})

export type ContactNoteInput = z.input<typeof contactNoteSchema>
