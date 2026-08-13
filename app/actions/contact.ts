'use server'

import { revalidatePath } from 'next/cache'
import { and, count, eq, gte, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contactMessages } from '@/lib/db/schema'
import { getCurrentUser, requireAdmin } from '@/lib/auth'
import {
  bulkContactStatusSchema,
  contactNoteSchema,
  contactStatusUpdateSchema,
  submitContactSchema,
  type BulkContactStatusInput,
  type ContactNoteInput,
  type ContactStatusUpdateInput,
  type SubmitContactInput,
} from '@/lib/validation/contact'
import { uuidSchema } from '@/lib/validation/admin'
import { parseOrThrow } from '@/lib/validation/shared'
import type { ContactStatus } from '@/lib/admin/contact-status'

/** The inbox is the only page a contact message appears on. */
function refresh(): void {
  revalidatePath('/admin/contact')
}

/* -------------------------------------------------------------------------- */
/* Public                                                                      */
/* -------------------------------------------------------------------------- */

/** How many messages one email address may send inside `FLOOD_WINDOW_MS`. */
const FLOOD_LIMIT = 5
const FLOOD_WINDOW_MS = 60 * 60 * 1000

export type SubmitContactResult =
  | { ok: true }
  | { ok: false; error: 'invalid' | 'too-many'; message?: string }

/**
 * Files a message from the public contact form.
 *
 * Returns a result object rather than throwing, like `submitReview`: a
 * rejected message is an ordinary outcome the form has to explain in the
 * visitor's own language, not an exception.
 *
 * No sign-in is required — most people who need to ask "where is my order" are
 * not signed in when they ask. That makes this the one write in the app with no
 * identity behind it, so the flood check below stands in for the auth guard the
 * other actions have.
 */
export async function submitContactMessage(
  input: SubmitContactInput,
): Promise<SubmitContactResult> {
  let data
  try {
    data = parseOrThrow(submitContactSchema, input)
  } catch (error) {
    return {
      ok: false,
      error: 'invalid',
      message: error instanceof Error ? error.message : undefined,
    }
  }

  // Cheap and honest: it stops the same address hammering the form, which is
  // the abuse that actually fills this table. It does not pretend to stop a
  // determined script rotating addresses — that needs a captcha, which is a
  // decision about the storefront rather than about this action.
  const [flood] = await db
    .select({ n: count() })
    .from(contactMessages)
    .where(
      and(
        eq(contactMessages.email, data.email),
        gte(contactMessages.createdAt, new Date(Date.now() - FLOOD_WINDOW_MS)),
      ),
    )

  if ((flood?.n ?? 0) >= FLOOD_LIMIT) return { ok: false, error: 'too-many' }

  // Recorded only if they happen to be signed in; the form never asks them to
  // be, and `getCurrentUser` costs nothing extra when they are not.
  const user = await getCurrentUser()

  await db.insert(contactMessages).values({
    userId: user?.id ?? null,
    name: data.name,
    email: data.email,
    phone: data.phone,
    subject: data.subject,
    message: data.message,
    // `status` is deliberately absent — the column default is 'new', which is
    // what an unread message is.
  })

  refresh()
  return { ok: true }
}

/* -------------------------------------------------------------------------- */
/* Admin                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * A status change is the write plus who made it and when. `handledAt` is only
 * stamped once the message leaves the inbox proper: merely opening something
 * is not handling it, so `read` keeps whatever was there before.
 */
function statusValues(status: ContactStatus, adminId: number) {
  return {
    status,
    handledByUserId: adminId,
    ...(status === 'new' || status === 'read' ? {} : { handledAt: new Date() }),
  }
}

export async function setContactMessageStatus(
  input: ContactStatusUpdateInput,
): Promise<void> {
  const me = await requireAdmin()
  const data = parseOrThrow(contactStatusUpdateSchema, input)

  const rows = await db
    .update(contactMessages)
    .set(statusValues(data.status, me.id))
    .where(eq(contactMessages.id, data.id))
    .returning({ id: contactMessages.id })

  if (rows.length === 0) throw new Error('That message no longer exists')
  refresh()
}

export async function setContactMessagesStatus(
  input: BulkContactStatusInput,
): Promise<void> {
  const me = await requireAdmin()
  const data = parseOrThrow(bulkContactStatusSchema, input)

  await db
    .update(contactMessages)
    .set(statusValues(data.status, me.id))
    .where(inArray(contactMessages.id, data.ids))

  refresh()
}

/** Internal shorthand against a message — never shown to the sender. */
export async function setContactMessageNote(
  input: ContactNoteInput,
): Promise<void> {
  await requireAdmin()
  const data = parseOrThrow(contactNoteSchema, input)

  const rows = await db
    .update(contactMessages)
    .set({ adminNote: data.note })
    .where(eq(contactMessages.id, data.id))
    .returning({ id: contactMessages.id })

  if (rows.length === 0) throw new Error('That message no longer exists')
  refresh()
}

/**
 * Permanent, unlike archiving. Kept for the genuine spam an admin does not want
 * sitting in the table at all; the UI asks first and points at Archive instead.
 */
export async function deleteContactMessage(id: string): Promise<void> {
  await requireAdmin()
  const messageId = parseOrThrow(uuidSchema, id)

  const rows = await db
    .delete(contactMessages)
    .where(eq(contactMessages.id, messageId))
    .returning({ id: contactMessages.id })

  if (rows.length === 0) throw new Error('That message no longer exists')
  refresh()
}
