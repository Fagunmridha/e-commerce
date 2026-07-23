import { Webhook } from 'svix'
import { headers } from 'next/headers'
import type { WebhookEvent } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

/**
 * Keeps the `users` table in sync with Clerk. Configure a webhook endpoint in
 * the Clerk dashboard pointing at /api/webhooks/clerk for the user.created,
 * user.updated and user.deleted events, and copy its signing secret into
 * CLERK_WEBHOOK_SIGNING_SECRET.
 */
export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET
  if (!secret) {
    return new Response('Missing CLERK_WEBHOOK_SIGNING_SECRET', { status: 500 })
  }

  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const body = await req.text()

  let event: WebhookEvent
  try {
    event = new Webhook(secret).verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  switch (event.type) {
    case 'user.created':
    case 'user.updated': {
      const { id, email_addresses, primary_email_address_id, first_name, last_name } =
        event.data
      const email =
        email_addresses.find((e) => e.id === primary_email_address_id)
          ?.email_address ??
        email_addresses[0]?.email_address ??
        ''
      const name = [first_name, last_name].filter(Boolean).join(' ') || null

      await db
        .insert(users)
        .values({ clerkId: id, email, name })
        .onConflictDoUpdate({
          target: users.clerkId,
          // Role is intentionally NOT touched here — it is owned by the admin.
          set: { email, name },
        })
      break
    }
    case 'user.deleted': {
      if (event.data.id) {
        await db.delete(users).where(eq(users.clerkId, event.data.id))
      }
      break
    }
  }

  return new Response('ok', { status: 200 })
}
