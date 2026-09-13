'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { LoadingOverlay } from '@/components/loading-overlay'
import { reviewProduct } from '@/app/actions/admin'

export type ListingReviewRow = {
  id: string
  name: string
  image: string
  category: string
  catalogue: string
  shopName: string
  price: string
  stock: number
  moq: number
  submitted: string
}

/**
 * The queue, one card per listing awaiting a verdict.
 *
 * Cards rather than the table `/admin/products` uses: the decision here is
 * about the goods — is this photo the product, is this price plausible, is it
 * filed in the right place — and a 40px thumbnail in a table row is not enough
 * to decide that on. The table is for managing stock; this is for looking at it.
 *
 * The rejection note lives inline on the card being rejected rather than in a
 * dialog, so an admin can read the listing while writing why it is wrong.
 */
export function ListingReview({ rows }: { rows: ListingReviewRow[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  /** The listing whose rejection note is open, and what has been typed. */
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  const decide = (id: string, status: 'approved' | 'rejected', note: string | null) =>
    startTransition(async () => {
      try {
        await reviewProduct(id, status, note)
        toast.success(status === 'approved' ? 'Listing is live' : 'Listing rejected')
        setRejecting(null)
        setReason('')
        router.refresh()
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Something went wrong',
        )
      }
    })

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border p-10 text-center">
        <p className="text-sm text-muted-foreground">
          Nothing waiting. New seller listings land here the moment they are
          saved, and stay off the marketplace until you approve them.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <LoadingOverlay show={pending} label="Saving verdict…" />

      {rows.map((row) => (
        <div
          key={row.id}
          className="flex flex-wrap items-start gap-4 rounded-lg border border-border p-4"
        >
          {/* Plain <img>: a seller's image is hosted wherever they uploaded it,
              which is not necessarily a host next/image is configured for. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={row.image}
            alt=""
            className="size-24 shrink-0 rounded-md bg-muted object-cover"
          />

          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground">{row.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {row.shopName} · {row.category}
              {row.catalogue && ` › ${row.catalogue}`} · submitted{' '}
              {row.submitted}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {row.price} · {row.stock} in stock · min order {row.moq}
            </p>

            {rejecting === row.id && (
              <div className="mt-3 space-y-2">
                <Textarea
                  rows={2}
                  autoFocus
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="What is wrong with it? The seller sees this and resubmits."
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={pending || !reason.trim()}
                    onClick={() => decide(row.id, 'rejected', reason.trim())}
                  >
                    Confirm rejection
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRejecting(null)
                      setReason('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {rejecting !== row.id && (
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="ghost">
                <Link href={`/admin/products/${row.id}`}>Open</Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => {
                  setRejecting(row.id)
                  setReason('')
                }}
              >
                Reject
              </Button>
              <Button
                size="sm"
                disabled={pending}
                onClick={() => decide(row.id, 'approved', null)}
              >
                Approve
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
