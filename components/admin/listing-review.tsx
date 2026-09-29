'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Store,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { LoadingOverlay } from '@/components/loading-overlay'
import { reviewProduct } from '@/app/actions/admin'
import { APPROVAL_CLASS, APPROVAL_LABEL } from '@/lib/admin/product-status'
import { cn } from '@/lib/utils'

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
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-12 text-center">
        <div className="rounded-full bg-emerald-500/10 p-3">
          <CheckCircle2 className="size-6 text-emerald-600" aria-hidden />
        </div>
        <p className="text-sm font-medium text-foreground">All caught up</p>
        <p className="max-w-sm text-sm text-muted-foreground">
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
        <article
          key={row.id}
          className="rounded-xl border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-card-hover sm:p-5"
        >
          <div className="flex flex-wrap items-start gap-4">
            {/* Plain <img>: a seller's image is hosted wherever they uploaded
                it, which is not necessarily a host next/image is configured
                for. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={row.image}
              alt=""
              className="size-20 shrink-0 rounded-lg border border-border bg-muted object-cover sm:size-24"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-foreground">{row.name}</p>
                <Badge
                  variant="outline"
                  className={cn('border-transparent', APPROVAL_CLASS.pending)}
                >
                  {APPROVAL_LABEL.pending}
                </Badge>
              </div>

              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Store className="size-3.5" aria-hidden />
                  {row.shopName}
                </span>
                <span>
                  {row.category}
                  {row.catalogue && ` › ${row.catalogue}`}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" aria-hidden />
                  Submitted {row.submitted}
                </span>
              </p>

              <p className="mt-2 text-sm">
                <span className="font-semibold text-foreground">
                  {row.price}
                </span>
                <span className="text-muted-foreground">
                  {' '}
                  ·{' '}
                  <span className={row.stock === 0 ? 'font-medium text-destructive' : undefined}>
                    {row.stock} in stock
                  </span>{' '}
                  · min order {row.moq}
                </span>
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
              <div className="flex w-full flex-wrap items-center gap-2 border-t border-border pt-3 sm:w-auto sm:border-t-0 sm:pt-0">
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/admin/products/${row.id}`}>
                    <ExternalLink className="size-4" aria-hidden />
                    Open
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={pending}
                  onClick={() => {
                    setRejecting(row.id)
                    setReason('')
                  }}
                >
                  <XCircle className="size-4" aria-hidden />
                  Reject
                </Button>
                <Button size="sm" disabled={pending} onClick={() => decide(row.id, 'approved', null)}>
                  <CheckCircle2 className="size-4" aria-hidden />
                  Approve
                </Button>
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}
