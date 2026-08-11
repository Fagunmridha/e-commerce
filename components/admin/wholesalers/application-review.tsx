'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { LoadingOverlay } from '@/components/loading-overlay'
import {
  WHOLESALER_STATUS_CLASS,
  WHOLESALER_STATUS_LABEL,
  type WholesalerStatus,
} from '@/lib/admin/wholesaler-status'
import { reviewApplication } from '@/app/actions/wholesalers'

export type ApplicationDetailView = {
  id: string
  status: WholesalerStatus
  fields: { label: string; value: string; href?: string }[]
  documents: { label: string; url: string }[]
  /** What the shop currently has listed — they manage this themselves. */
  products: {
    name: string
    image: string
    category: string
    price: string
    sizes: string
    stock: number
    moq: number
    href: string
  }[]
  reviewNote: string | null
  reviewedBy: string | null
  reviewedAt: string | null
}

export function ApplicationReview({
  application,
}: {
  application: ApplicationDetailView
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [note, setNote] = useState(application.reviewNote ?? '')

  const decide = (status: WholesalerStatus, success: string) =>
    startTransition(async () => {
      try {
        await reviewApplication({ id: application.id, status, note })
        toast.success(success)
        router.refresh()
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Something went wrong',
        )
      }
    })

  return (
    <div className="space-y-6">
      {/* A decision revalidates and re-renders the whole page; without this the
          admin gets no answer to a click on Approve until it lands. */}
      <LoadingOverlay show={pending} label="Saving decision…" />

      <section className="rounded-lg border border-border p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-foreground">Application</h3>
          <Badge
            variant="secondary"
            className={`border-0 ${WHOLESALER_STATUS_CLASS[application.status]}`}
          >
            {WHOLESALER_STATUS_LABEL[application.status]}
          </Badge>
        </div>

        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {application.fields.map((field) => (
            <div key={field.label} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{field.label}</dt>
              <dd className="truncate text-sm text-foreground">
                {field.href ? (
                  <a
                    href={field.href}
                    className="hover:underline"
                    rel="noreferrer"
                  >
                    {field.value}
                  </a>
                ) : (
                  field.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-lg border border-border p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Documents</h3>
        {application.documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing attached — the form asks for a tax token, a trade licence and
            a shop photo. Verify by hand, or reject with a note asking for them.
          </p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {application.documents.map((doc) => (
              <a
                key={doc.label}
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="group w-48 overflow-hidden rounded-md border border-border"
              >
                {/* Plain <img>: an admin-only thumbnail of a document blob,
                    whose host is not necessarily one next/image is configured
                    for — and re-encoding a trade licence to AVIF would only
                    make the small print harder to read. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={doc.url}
                  alt={doc.label}
                  className="h-32 w-full bg-muted object-cover transition-opacity group-hover:opacity-90"
                />
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  {doc.label}
                </p>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground">
          Live listings ({application.products.length})
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Added by the shop from their own dashboard, at their own prices.
          Suspending hides all of them at once without deleting anything.
        </p>

        {application.products.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {application.status === 'approved'
              ? 'They have not listed anything yet.'
              : 'Nothing yet — a shop can only list stock once it is approved.'}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="pb-2 text-left font-medium">Product</th>
                  <th className="pb-2 text-left font-medium">Category</th>
                  <th className="pb-2 text-left font-medium">Sizes</th>
                  <th className="pb-2 text-right font-medium">Price</th>
                  <th className="pb-2 text-right font-medium">Pieces</th>
                  <th className="pb-2 text-right font-medium">Min order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {application.products.map((product, index) => (
                  <tr key={`${product.name}-${index}`}>
                    <td className="py-2">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.image}
                          alt=""
                          className="size-10 shrink-0 rounded-md bg-muted object-cover"
                        />
                        <Link
                          href={product.href}
                          className="truncate font-medium hover:underline"
                        >
                          {product.name}
                        </Link>
                      </div>
                    </td>
                    <td className="py-2 text-muted-foreground capitalize">
                      {product.category}
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {product.sizes}
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      {product.price}
                    </td>
                    <td className="py-2 text-right text-muted-foreground">
                      {product.stock}
                    </td>
                    <td className="py-2 text-right text-muted-foreground">
                      {product.moq}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground">Decision</h3>
        {application.reviewedAt && (
          <p className="mt-1 text-xs text-muted-foreground">
            Last reviewed by {application.reviewedBy ?? 'a deleted admin'} on{' '}
            {application.reviewedAt}
          </p>
        )}

        <div className="mt-4 space-y-1.5">
          <Label htmlFor="review-note">Note to the applicant</Label>
          <Textarea
            id="review-note"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Shown on their /wholesale page — required in practice when rejecting."
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            disabled={pending || application.status === 'approved'}
            onClick={() =>
              decide('approved', 'Approved — their dashboard is open')
            }
          >
            Approve
          </Button>
          <Button
            variant="outline"
            disabled={pending || application.status === 'rejected'}
            onClick={() => {
              if (!note.trim()) {
                toast.error('Add a note so they know what to fix')
                return
              }
              decide('rejected', 'Application rejected')
            }}
          >
            Reject
          </Button>
          {application.status === 'approved' && (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => decide('suspended', 'Wholesale access suspended')}
            >
              Suspend
            </Button>
          )}
        </div>
      </section>
    </div>
  )
}
