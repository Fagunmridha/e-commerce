'use server'

import { revalidatePath } from 'next/cache'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users, wholesalerApplications, type WholesaleRole } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { parseOrThrow } from '@/lib/validation/shared'
import {
  wholesaleApplicationSchema,
  type WholesaleApplicationInput,
} from '@/lib/validation/wholesalers'

export type { WholesaleApplicationInput }

/**
 * Joins the wholesale programme as a buyer or as a seller.
 *
 * This is the whole of the buyer's onboarding — no form, no queue, the market
 * unlocks on the next render. A seller is only *started* here: the row this
 * writes lets them reach `/wholesale/apply`, and it stays worth nothing until
 * an admin approves the application at the other end.
 *
 * The choice is one-way. Not a technical limitation — it is the rule the two
 * sides rest on, since a seller who could flip to buyer for an afternoon would
 * be buying from the same market they sell into. Changing sides means asking
 * an admin, which is deliberate.
 */
export async function chooseWholesaleRole(
  role: WholesaleRole,
): Promise<{ ok: true; role: WholesaleRole } | { ok: false; error: string }> {
  if (role !== 'buyer' && role !== 'seller') {
    return { ok: false, error: 'Pick either the buyer or the seller side.' }
  }

  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'You need to sign in first.' }

  // Idempotent for the side they are already on, so a double-submit or a stale
  // tab re-posting the same button is not an error.
  if (user.wholesaleRole === role) return { ok: true, role }

  if (user.wholesaleRole) {
    return {
      ok: false,
      error:
        user.wholesaleRole === 'buyer'
          ? 'You have already joined as a wholesale buyer.'
          : 'You have already joined as a wholesaler.',
    }
  }

  // `IS NULL` in the predicate, not just the check above: two tabs submitting
  // opposite sides at once would both pass that read, and the loser of the race
  // must not overwrite the winner.
  const [updated] = await db
    .update(users)
    .set({ wholesaleRole: role })
    .where(and(eq(users.id, user.id), isNull(users.wholesaleRole)))
    .returning({ wholesaleRole: users.wholesaleRole })

  if (!updated) {
    return { ok: false, error: 'You have already joined the wholesale programme.' }
  }

  revalidatePath('/wholesale')
  revalidatePath('/wholesale/market')
  revalidatePath('/wholesale/apply')
  return { ok: true, role }
}

/**
 * Submits — or resubmits — a wholesale application.
 *
 * Unlike the admin actions this one returns a result object instead of
 * throwing: the caller is a shopper filling in a long form, and "something
 * went wrong" in a toast is not a useful thing to hand them.
 */
export async function submitWholesaleApplication(
  input: WholesaleApplicationInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'You need to sign in first.' }

  // A buyer must never end up owning a shop: the two sides are exclusive, and
  // the form is reachable by URL whatever the page chrome offers.
  if (user.wholesaleRole === 'buyer') {
    return {
      ok: false,
      error: 'You joined as a wholesale buyer, so you cannot also sell.',
    }
  }

  let data
  try {
    data = parseOrThrow(wholesaleApplicationSchema, input)
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Invalid application',
    }
  }

  const [existing] = await db
    .select({ status: wholesalerApplications.status })
    .from(wholesalerApplications)
    .where(eq(wholesalerApplications.userId, user.id))

  if (existing?.status === 'approved') {
    return { ok: false, error: 'Your account is already approved.' }
  }
  if (existing?.status === 'suspended') {
    return {
      ok: false,
      error: 'Your wholesale access is suspended — please contact us.',
    }
  }

  const values = {
    userId: user.id,
    shopName: data.shopName,
    businessType: data.businessType,
    taxToken: data.taxToken,
    binNumber: data.binNumber,
    tradeLicenseNo: data.tradeLicenseNo,
    yearsInBusiness: data.yearsInBusiness,
    contactName: data.contactName,
    phone: data.phone,
    altPhone: data.altPhone,
    email: data.email,
    website: data.website,
    address: data.address,
    city: data.city,
    district: data.district,
    postcode: data.postcode,
    tradeLicenseImage: data.tradeLicenseImage,
    shopPhoto: data.shopPhoto,
    ownerPhoto: data.ownerPhoto,
    note: data.note,
    // A resubmission goes back into the queue and clears the old verdict, so a
    // stale rejection reason is never shown against fresh details.
    status: 'pending' as const,
    reviewNote: null,
    reviewedByUserId: null,
    reviewedAt: null,
    updatedAt: new Date(),
  }

  const [application] = await db
    .insert(wholesalerApplications)
    .values(values)
    .onConflictDoUpdate({ target: wholesalerApplications.userId, set: values })
    .returning({ id: wholesalerApplications.id })

  if (!application) return { ok: false, error: 'Could not save your application.' }

  // Submitting the form *is* choosing the seller side, for anyone who reached
  // it without going through the chooser first. Guarded on null above, so this
  // can never move someone off the buyer side.
  if (!user.wholesaleRole) {
    await db
      .update(users)
      .set({ wholesaleRole: 'seller' })
      .where(and(eq(users.id, user.id), isNull(users.wholesaleRole)))
  }

  revalidatePath('/wholesale')
  revalidatePath('/wholesale/apply')
  revalidatePath('/admin/wholesalers')
  return { ok: true }
}
