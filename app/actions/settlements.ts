'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { settlements } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/auth'
import { parseOrThrow } from '@/lib/validation/shared'
import { markPaidSchema, type MarkPaidInput } from '@/lib/validation/settlements'

export type { MarkPaidInput }

/**
 * Recording payments to sellers.
 *
 * These throw rather than returning a result object, like every other admin
 * action — the caller is the console, and a thrown error surfaces as a toast
 * there. Nothing here creates or prices a settlement: `createOrder` writes the
 * row and `updateOrderStatus` moves it. All an admin does is state whether the
 * money has actually left, which no part of the app can observe on its own.
 */

function refresh(id: string) {
  revalidatePath('/admin/settlements')
  revalidatePath(`/admin/settlements/${id}`)
  // The seller's own payouts page reads the same rows.
  revalidatePath('/wholesale/payouts', 'layout')
}

/**
 * Marks a settlement paid.
 *
 * `status = 'due'` is in the WHERE clause, not checked beforehand: two admins
 * on the same row would otherwise both see "due" and both write, and the second
 * would overwrite the first's reference with its own. Paying something that was
 * never delivered is also refused here rather than left to a UI that might not
 * be looking at fresh data.
 */
export async function markSettlementPaid(input: MarkPaidInput): Promise<void> {
  const me = await requireAdmin()
  const data = parseOrThrow(markPaidSchema, input)

  const [updated] = await db
    .update(settlements)
    .set({
      status: 'paid',
      paidAt: new Date(),
      paidByUserId: me.id,
      paidNote: data.note,
    })
    .where(and(eq(settlements.id, data.id), eq(settlements.status, 'due')))
    .returning({ id: settlements.id })

  if (!updated) {
    throw new Error(
      'That settlement is not due — it may already be paid, or its order is not delivered.',
    )
  }

  refresh(data.id)
}

/**
 * Undoes a payment recorded by mistake.
 *
 * Back to `due`, never to `pending` or `void`: the order was delivered when the
 * money was recorded, and this action is about the payment being wrong, not the
 * delivery. If the order has since been cancelled it will show up in the
 * reconcile view either way.
 */
export async function markSettlementUnpaid(id: string): Promise<void> {
  await requireAdmin()

  const [updated] = await db
    .update(settlements)
    .set({ status: 'due', paidAt: null, paidByUserId: null, paidNote: null })
    .where(and(eq(settlements.id, id), eq(settlements.status, 'paid')))
    .returning({ id: settlements.id })

  if (!updated) throw new Error('That settlement is not marked paid.')

  refresh(id)
}
