'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { verifyAdvance } from '@/app/actions/admin'
import type { AdvanceVerdict, OrderStatus } from '@/lib/orders'

/**
 * Two buttons rather than a select: this is a one-way ruling, not a status that
 * gets nudged along, and the admin has just finished comparing a transaction ID
 * against their bKash statement. Re-ruling stays possible — a payment that
 * turns up late should not be permanently stuck at "failed".
 *
 * `orderStatus` is passed through so the timeline entry can be stamped with the
 * order's current status; see `setAdvanceStatus`.
 */
export function AdvanceVerify({
  orderId,
  orderStatus,
  paymentStatus,
}: {
  orderId: string
  orderStatus: OrderStatus
  paymentStatus: 'advance_pending' | 'advance_paid' | 'advance_failed'
}) {
  const [pending, startTransition] = useTransition()

  const rule = (verdict: AdvanceVerdict) =>
    startTransition(async () => {
      try {
        await verifyAdvance(orderId, verdict, orderStatus)
        toast.success(
          verdict === 'advance_paid'
            ? 'Advance marked as received'
            : 'Advance marked as not received',
        )
      } catch {
        toast.error('Could not record the verdict')
      }
    })

  return (
    <div className="mt-3 flex flex-wrap gap-2 print:hidden">
      <Button
        type="button"
        size="sm"
        disabled={pending || paymentStatus === 'advance_paid'}
        onClick={() => rule('advance_paid')}
      >
        Mark received
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending || paymentStatus === 'advance_failed'}
        onClick={() => rule('advance_failed')}
      >
        Not received
      </Button>
    </div>
  )
}
