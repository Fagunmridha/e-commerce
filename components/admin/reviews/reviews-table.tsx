'use client'

import Link from 'next/link'
import { useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { DataTable } from '@/components/admin/data-table/data-table'
import { DataTableColumnHeader } from '@/components/admin/data-table/column-header'
import {
  REVIEW_STATUS_CLASS,
  REVIEW_STATUS_LABEL,
} from '@/lib/admin/review-status'
import {
  deleteReview,
  setReviewFeatured,
  setReviewStatus,
  setReviewsStatus,
} from '@/app/actions/reviews'
import type { AdminReviewRow } from '@/lib/reviews'

export function ReviewsTable({ reviews }: { reviews: AdminReviewRow[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const run = (action: () => Promise<void>, success: string) =>
    startTransition(async () => {
      try {
        await action()
        toast.success(success)
        router.refresh()
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Something went wrong',
        )
      }
    })

  const columns = useMemo<ColumnDef<AdminReviewRow, unknown>[]>(
    () => [
      {
        id: 'select',
        enableSorting: false,
        enableHiding: false,
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all reviews"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={`Select review by ${row.original.authorName}`}
          />
        ),
      },
      {
        accessorKey: 'productName',
        meta: { label: 'Product' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Product" />
        ),
        cell: ({ row }) => (
          <Link
            href={`/product/${row.original.productId}`}
            className="font-medium text-foreground hover:underline"
          >
            {row.original.productName}
          </Link>
        ),
      },
      {
        accessorKey: 'authorName',
        meta: { label: 'Reviewer' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Reviewer" />
        ),
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm">{row.original.authorName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.authorEmail}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'rating',
        meta: { label: 'Rating' },
        // Numeric rather than stars so the column sorts, and so a one-star
        // review is findable by filtering rather than by scanning.
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Rating" />
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.rating} ★</span>
        ),
        filterFn: (row, id, value) => String(row.getValue(id)) === value,
      },
      {
        accessorKey: 'body',
        meta: { label: 'Review' },
        enableSorting: false,
        header: 'Review',
        cell: ({ row }) => (
          <p
            className="line-clamp-3 max-w-md whitespace-normal text-sm text-muted-foreground"
            title={row.original.body}
          >
            {row.original.body}
          </p>
        ),
      },
      {
        accessorKey: 'submitted',
        meta: { label: 'Submitted' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Submitted" />
        ),
      },
      {
        accessorKey: 'status',
        meta: { label: 'Status' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={`border-0 ${REVIEW_STATUS_CLASS[row.original.status]}`}
          >
            {REVIEW_STATUS_LABEL[row.original.status]}
          </Badge>
        ),
        filterFn: (row, id, value) => row.getValue(id) === value,
      },
      {
        accessorKey: 'featured',
        meta: { label: 'Featured' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Featured" />
        ),
        cell: ({ row }) => (
          // Disabled until approved: the homepage feed requires
          // `status = 'approved'`, so featuring anything else would be a switch
          // that changes nothing. The server enforces the same rule.
          <Switch
            checked={row.original.featured}
            disabled={pending || row.original.status !== 'approved'}
            aria-label={`Feature ${row.original.authorName}'s review on the homepage`}
            onCheckedChange={(featured) =>
              run(
                () => setReviewFeatured({ id: row.original.id, featured }),
                featured ? 'Featured on the homepage' : 'Removed from homepage',
              )
            }
          />
        ),
        filterFn: (row, id, value) => String(row.getValue(id)) === value,
      },
      {
        id: 'actions',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">
                  Actions for {row.original.authorName}&apos;s review
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Review</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/product/${row.original.productId}#reviews`}>
                  View on product
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {row.original.status !== 'approved' && (
                <DropdownMenuItem
                  disabled={pending}
                  onSelect={() =>
                    run(
                      () =>
                        setReviewStatus({
                          id: row.original.id,
                          status: 'approved',
                        }),
                      'Review published',
                    )
                  }
                >
                  Approve
                </DropdownMenuItem>
              )}
              {row.original.status !== 'rejected' && (
                <DropdownMenuItem
                  disabled={pending}
                  onSelect={() =>
                    run(
                      () =>
                        setReviewStatus({
                          id: row.original.id,
                          status: 'rejected',
                        }),
                      // Says what it costs: rejecting an approved review pulls
                      // its stars back out of the product's average.
                      'Review hidden — the product rating has been recalculated',
                    )
                  }
                >
                  Reject
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={pending}
                onSelect={() => {
                  if (
                    !confirm(
                      `Delete ${row.original.authorName}'s review of ${row.original.productName}? This cannot be undone — reject it instead if you only want it hidden.`,
                    )
                  ) {
                    return
                  }
                  run(() => deleteReview(row.original.id), 'Review deleted')
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [pending],
  )

  return (
    <DataTable
      columns={columns}
      data={reviews}
      searchColumn="authorName"
      searchPlaceholder="Search reviewers…"
      facets={[
        {
          column: 'status',
          label: 'Status',
          options: Object.entries(REVIEW_STATUS_LABEL).map(
            ([value, label]) => ({ value, label }),
          ),
        },
        {
          column: 'rating',
          label: 'Rating',
          options: [5, 4, 3, 2, 1].map((value) => ({
            value: String(value),
            label: `${value} ★`,
          })),
        },
        {
          column: 'featured',
          label: 'Featured',
          options: [
            { value: 'true', label: 'Featured' },
            { value: 'false', label: 'Not featured' },
          ],
        },
      ]}
      bulkActions={[
        {
          label: 'Approve',
          onSelect: (rows) =>
            run(
              () =>
                setReviewsStatus({
                  ids: rows.map((r) => r.id),
                  status: 'approved',
                }),
              `${rows.length} review(s) published`,
            ),
        },
        {
          label: 'Reject',
          destructive: true,
          onSelect: (rows) =>
            run(
              () =>
                setReviewsStatus({
                  ids: rows.map((r) => r.id),
                  status: 'rejected',
                }),
              `${rows.length} review(s) hidden`,
            ),
        },
      ]}
      exportFileName="reviews"
      emptyState={
        <Empty className="border-0">
          <EmptyHeader>
            <EmptyTitle>No reviews yet</EmptyTitle>
            <EmptyDescription>
              Customers write these from a product page. New reviews land here as
              pending and stay hidden until you approve them.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      }
    />
  )
}
