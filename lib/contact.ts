import 'server-only'
import { asc, count, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contactMessages } from '@/lib/db/schema'
import type { ContactStatus } from '@/lib/admin/contact-status'

/**
 * Reads for the contact inbox. Nothing here is cached: an admin working through
 * messages must never be looking at a minute-old queue, and a message they just
 * marked replied has to leave the New pill immediately.
 */

/** A row of the admin inbox. English-only, like the whole console. */
export type AdminContactRow = {
  id: string
  name: string
  email: string
  phone: string
  subject: string
  message: string
  status: ContactStatus
  adminNote: string | null
  /** Set when the sender was signed in — the console links to their profile. */
  userId: number | null
  received: string
  /** Full timestamp, for the title attribute on the short date. */
  receivedAt: string
  handledAt: string | null
}

export async function getAdminContactMessages(filter?: {
  status?: ContactStatus
}): Promise<AdminContactRow[]> {
  const rows = await db
    .select()
    .from(contactMessages)
    .where(filter?.status ? eq(contactMessages.status, filter.status) : undefined)
    .orderBy(
      // Unanswered mail leads whatever the sort — that is the work. `archived`
      // sinks below everything, since filing something away is how an admin
      // says "not this".
      asc(sql`case
        when ${contactMessages.status} = 'new' then 0
        when ${contactMessages.status} = 'read' then 1
        when ${contactMessages.status} = 'replied' then 2
        else 3
      end`),
      desc(contactMessages.createdAt),
    )

  const day = (value: Date | null) =>
    value
      ? value.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : null

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    status: row.status,
    adminNote: row.adminNote,
    userId: row.userId,
    received: day(row.createdAt) ?? '',
    receivedAt: row.createdAt.toISOString(),
    handledAt: day(row.handledAt),
  }))
}

/** One GROUP BY for the status pills, instead of four passes over the table. */
export async function getContactStatusCounts(): Promise<
  Record<ContactStatus | 'all', number>
> {
  const rows = await db
    .select({ status: contactMessages.status, n: count() })
    .from(contactMessages)
    .groupBy(contactMessages.status)

  const counts = { all: 0, new: 0, read: 0, replied: 0, archived: 0 }
  for (const row of rows) {
    counts[row.status] = row.n
    counts.all += row.n
  }
  return counts
}

/** Drives the admin header bell, beside pending orders, reviews and applications. */
export async function getNewContactCount(): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(contactMessages)
    .where(eq(contactMessages.status, 'new'))

  return row?.n ?? 0
}
