'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { wholesalerApplications } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { parseOrThrow } from '@/lib/validation/shared'
import {
  wholesaleApplicationSchema,
  type WholesaleApplicationInput,
} from '@/lib/validation/wholesalers'

export type { WholesaleApplicationInput }

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
    taxTokenImage: data.taxTokenImage,
    tradeLicenseImage: data.tradeLicenseImage,
    shopPhoto: data.shopPhoto,
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

  revalidatePath('/wholesale')
  revalidatePath('/wholesale/apply')
  revalidatePath('/admin/wholesalers')
  return { ok: true }
}
