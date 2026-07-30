import 'server-only'
import { cache } from 'react'
import { auth, currentUser } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users, type UserRow } from '@/lib/db/schema'

/**
 * Resolves the Clerk-authenticated user to our database row. Falls back to
 * creating the row on first sight, so the app works even if the Clerk webhook
 * has not fired yet (e.g. local dev without a public webhook URL).
 *
 * Request-scoped: a single render can reach this through the layout, a page and
 * several guards, and each call was its own Neon round trip.
 */
export const getCurrentUser = cache(async function getCurrentUser(): Promise<UserRow | null> {
  const { userId } = await auth()
  if (!userId) return null

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, userId))

  if (existing) return existing

  // First request before the webhook landed — create the row now.
  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    ''
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null

  const [created] = await db
    .insert(users)
    .values({ clerkId: userId, email, name })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: { email, name },
    })
    .returning()

  return created ?? null
})

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'admin'
}

/** Throws when the current user is not an admin — use to guard admin actions. */
export async function requireAdmin(): Promise<UserRow> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    throw new Error('Not authorized')
  }
  return user
}
