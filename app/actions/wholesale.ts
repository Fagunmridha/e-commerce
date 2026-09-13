'use server'

import { revalidatePath } from 'next/cache'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  users,
  wholesalerApplications,
  wholesalerTradeLines,
  type WholesaleRole,
} from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { getWholesaleLines } from '@/lib/products'
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

  // The schema can only say the field was filled in. Whether that slug exists,
  // and whether it is a trade line rather than a category under one, are
  // database questions — and this action is a public endpoint, so a
  // hand-rolled request must not be able to book a shop into the
  // storefront-only "kids" aisle, or into a line that does not exist.
  const lines = await getWholesaleLines()
  if (!lines.some((line) => line.slug === data.categorySlug)) {
    return { ok: false, error: 'Pick a trade line from the list.' }
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
    categorySlug: data.categorySlug,
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

  /**
   * Record the line this submission asked for.
   *
   * A shop deals in one line, so this is one row — but it lives in
   * `wholesaler_trade_lines` rather than only on `category_slug`, because the
   * *verdict* belongs to the pair: `requested` is what the applicant picked,
   * `approved` is what an admin granted, and the two are not the same fact.
   *
   * Delete-then-insert, scoped to `requested`: a resubmission that switches
   * line has to drop the old request, while an admin's existing `approved` grant
   * survives — which is what `onConflictDoNothing` then leaves alone.
   *
   * Neon's HTTP driver has no interactive transaction, so this is a `batch`:
   * one round trip, and the delete cannot land without the insert behind it.
   */
  await db.batch([
    db
      .delete(wholesalerTradeLines)
      .where(
        and(
          eq(wholesalerTradeLines.applicationId, application.id),
          eq(wholesalerTradeLines.status, 'requested'),
        ),
      ),
    db
      .insert(wholesalerTradeLines)
      .values({
        applicationId: application.id,
        categorySlug: data.categorySlug,
      })
      .onConflictDoNothing(),
  ])

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
