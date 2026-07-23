'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { setOrderStatus } from '@/app/actions/admin'
import type { OrderStatus } from '@/lib/orders'

const STATUSES: OrderStatus[] = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]

export function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string
  status: OrderStatus
}) {
  const [pending, startTransition] = useTransition()

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(event) => {
        const next = event.target.value as OrderStatus
        startTransition(async () => {
          try {
            await setOrderStatus(orderId, next)
            toast.success(`Marked ${next}`)
          } catch {
            toast.error('Could not update status')
          }
        })
      }}
      className="h-9 rounded-md border border-border bg-background px-3 text-sm capitalize outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      {STATUSES.map((option) => (
        <option key={option} value={option} className="capitalize">
          {option}
        </option>
      ))}
    </select>
  )
}
