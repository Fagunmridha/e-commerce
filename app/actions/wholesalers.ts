'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { wholesalerApplications, wholesalerTradeLines } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/auth'
import { getWholesaleLines } from '@/lib/products'
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
/**
 * Grants a shop exactly this set of trade lines — the admin's half of the
 * application, and the only thing that decides what a seller may list under.
 *
 * The set is replaced rather than added to, so unticking a line revokes it.
 * Revoking writes the row back to `requested` instead of deleting it: what the
 * applicant asked for is a fact about their application and must survive the
 * verdict, otherwise an admin who unticks Cosmetics can never see that it was
 * ever wanted.
 *
 * `category_slug` is re-stamped to the first grant, so the one-line answer
 * every summary screen shows agrees with the grants. It is deliberately not
 * cleared when nothing is granted — a shop mid-review keeps the line it had.
 *
 * Existing listings are left where they are. They stay live until the seller
 * next edits one, at which point the form corrects the value on save. Sweeping
 * them would mean deciding what to do with stock in a category this shop can no
 * longer reach, which is a bigger decision than a correction to one row.
 */
export async function setApplicationLines(
  id: string,
  categorySlugs: string[],
): Promise<void> {
  await requireAdmin()

  const granted = [...new Set(categorySlugs)]
  const lines = await getWholesaleLines()
  const known = new Set(lines.map((line) => line.slug))

  if (!granted.every((slug) => known.has(slug))) {
    throw new Error('That is not a wholesale trade line')
  }

  // Neon's HTTP driver has no interactive transaction, so this is one batch:
  // the demotion and the grants cannot land apart and leave a shop holding
  // neither. `onConflictDoUpdate` rather than insert — the row usually already
  // exists as `requested`, which is how it got in front of the admin.
  await db.batch([
    db
      .update(wholesalerTradeLines)
      .set({ status: 'requested' })
      .where(eq(wholesalerTradeLines.applicationId, id)),
    ...(granted.length > 0
      ? ([
          db
            .insert(wholesalerTradeLines)
            .values(
              granted.map((slug) => ({
                applicationId: id,
                categorySlug: slug,
                status: 'approved' as const,
              })),
            )
            .onConflictDoUpdate({
              target: [
                wholesalerTradeLines.applicationId,
                wholesalerTradeLines.categorySlug,
              ],
              set: { status: 'approved' as const },
            }),
          db
            .update(wholesalerApplications)
            .set({ categorySlug: granted[0], updatedAt: new Date() })
            .where(eq(wholesalerApplications.id, id)),
        ] as const)
      : []),
  ])

  refresh()
}

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
