'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  markSettlementPaid,
  markSettlementUnpaid,
} from '@/app/actions/settlements'
import type { SettlementStatus } from '@/lib/admin/settlement-status'

/**
 * Recording that the store has actually paid a shop.
 *
 * There is no gateway to ask, so a human is the only oracle — the same shape as
 * `AdvanceVerify`. The reference field is optional but strongly worth filling:
 * it prints on the seller's copy of the sheet, and it is the only evidence
 * either side will have if the payment is ever queried.
 *
 * Undoing stays available, because a payment recorded against the wrong
 * settlement is a real mistake and locking it in would help nobody.
 */
export function MarkPaid({
  id,
  status,
  payout,
}: {
  id: string
  status: SettlementStatus
  /** Shown on the button so the admin confirms an amount, not just an id. */
  payout: string
}) {
  const [pending, startTransition] = useTransition()
  const [note, setNote] = useState('')

  if (status === 'paid') {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full print:hidden"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await markSettlementUnpaid(id)
              toast.success('Payment record removed')
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : 'Could not undo the payment',
              )
            }
          })
        }
      >
        Undo payment
      </Button>
    )
  }

  // Only a delivered settlement is payable. `pending` means the goods have not
  // arrived and `void` means the order is cancelled — the server refuses both,
  // and saying so here saves the admin a failed round trip.
  if (status !== 'due') {
    return (
      <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground print:hidden">
        {status === 'pending'
          ? 'Payable once the order is delivered.'
          : 'The order was cancelled, so nothing is owed on this settlement.'}
      </p>
    )
  }

  return (
    <div className="space-y-2 print:hidden">
      <Input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Reference — bKash TrxID, cash, cheque no…"
        maxLength={200}
        className="h-9"
      />
      <Button
        type="button"
        className="w-full"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await markSettlementPaid({ id, note })
              toast.success('Marked as paid')
              setNote('')
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : 'Could not record the payment',
              )
            }
          })
        }
      >
        Mark {payout} as paid
      </Button>
    </div>
  )
}
