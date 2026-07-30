'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { wholesalerApplications } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/auth'
import { parseOrThrow } from '@/lib/validation/shared'
import {
  reviewDecisionSchema,
  type ReviewDecisionInput,
} from '@/lib/validation/wholesalers'

export type { ReviewDecisionInput }

function refresh() {
  // The catalogue tag covers both product lists, so a decision shows up in the
  // marketplace on the next request.
  updateTag('catalogue')
  revalidatePath('/admin/wholesalers')
  revalidatePath('/wholesale')
  revalidatePath('/wholesale/apply')
  revalidatePath('/wholesale/market')
  revalidatePath('/wholesale/dashboard')
  revalidatePath('/', 'layout')
}

/**
 * A verdict is only a status write.
 *
 * The seller's listings are ordinary `products` rows they own, and every read
 * path already joins on `wholesaler_applications.status = 'approved'` — so
 * suspending a shop hides its stock without touching a single product row, and
 * re-approving brings it back exactly as it was, reviews and all. An earlier
 * version deleted the rows here, which permanently destroyed the seller's own
 * catalogue on a pause that was meant to be temporary.
 */
function decisionValues(
  status: 'pending' | 'approved' | 'rejected' | 'suspended',
  note: string | null,
  adminId: number,
) {
  return {
    status,
    reviewNote: note,
    reviewedByUserId: adminId,
    reviewedAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Records a verdict. `reviewedByUserId` comes from the guard's return value,
 * so the audit trail cannot disagree with who was actually signed in.
 */
export async function reviewApplication(
  input: ReviewDecisionInput,
): Promise<void> {
  const me = await requireAdmin()
  const data = parseOrThrow(reviewDecisionSchema, input)

  await db
    .update(wholesalerApplications)
    .set(decisionValues(data.status, data.note, me.id))
    .where(eq(wholesalerApplications.id, data.id))

  refresh()
}

/**
 * Deletes the shop for good. `products.seller_id` cascades, so this *does* take
 * the listings with it — unlike suspending, which is reversible. That is the
 * whole difference between the two, and why the table asks before calling this.
 */
export async function deleteApplication(id: string): Promise<void> {
  await requireAdmin()
  await db
    .delete(wholesalerApplications)
    .where(eq(wholesalerApplications.id, id))
  refresh()
}

/** Bulk verdict driven by the table's row selection. */
export async function setApplicationsStatus(
  ids: string[],
  status: 'pending' | 'approved' | 'rejected' | 'suspended',
): Promise<void> {
  const me = await requireAdmin()
  if (ids.length === 0) return

  // One statement now that a decision is only a status write — bulk decisions
  // carry no note, which is why the review screen exists for anything else.
  await db
    .update(wholesalerApplications)
    .set(decisionValues(status, null, me.id))
    .where(inArray(wholesalerApplications.id, ids))

  refresh()
}
