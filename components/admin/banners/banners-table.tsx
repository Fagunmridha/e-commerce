'use client'

import Link from 'next/link'
import { useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  BANNER_STATUS_CLASS,
  BANNER_STATUS_LABEL,
  bannerStatus,
  formatWindow,
  type BannerStatus,
} from '@/lib/admin/banner-status'
import {
  deleteBanner,
  moveBanner,
  setBannerActive,
  setBannersActive,
} from '@/app/actions/banners'

/** Serialisable shape handed down from the server page. */
export type BannerRowView = {
  id: string
  slug: string
  placement: 'hero' | 'offer' | 'announcement'
  image: string
  title: string
  ctaHref: string
  startsAt: string | null
  endsAt: string | null
  active: boolean
  sortOrder: number
  /** Flattened for the CSV export, which reads raw row values. */
  status: BannerStatus
  window: string
}

const PLACEMENT_LABEL: Record<BannerRowView['placement'], string> = {
  hero: 'Hero',
  offer: 'Offer strip',
  announcement: 'Announcement',
}

export function BannersTable({ banners }: { banners: BannerRowView[] }) {
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

  const columns = useMemo<ColumnDef<BannerRowView, unknown>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all banners"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={`Select ${row.original.title}`}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'title',
        meta: { label: 'Banner' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Banner" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={row.original.image}
              alt=""
              className="size-12 shrink-0 rounded-md border border-border object-cover"
            />
            <div className="min-w-0">
              <Link
                href={`/admin/banners/${row.original.id}`}
                className="block truncate text-sm font-medium text-foreground hover:text-primary hover:underline"
              >
                {row.original.title}
              </Link>
              <p className="truncate text-xs text-muted-foreground">
                {row.original.ctaHref}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'placement',
        meta: { label: 'Placement' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Placement" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {PLACEMENT_LABEL[row.original.placement]}
          </span>
        ),
        filterFn: (row, id, value) => row.getValue(id) === value,
      },
      {
        accessorKey: 'status',
        meta: { label: 'Status' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const status = row.original.status
          return (
            <Badge
              variant="secondary"
              className={`border-0 ${BANNER_STATUS_CLASS[status]}`}
            >
              {BANNER_STATUS_LABEL[status]}
            </Badge>
          )
        },
        filterFn: (row, id, value) => row.getValue(id) === value,
      },
      {
        accessorKey: 'window',
        meta: { label: 'Schedule' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Schedule" />
        ),
        cell: ({ row }) => (
          <span className="text-sm whitespace-nowrap text-muted-foreground">
            {row.original.window}
          </span>
        ),
      },
      {
        accessorKey: 'sortOrder',
        meta: { label: 'Order' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Order" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <span className="w-4 text-sm text-muted-foreground">
              {row.original.sortOrder}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              disabled={pending}
              aria-label={`Move ${row.original.title} up`}
              onClick={() =>
                run(() => moveBanner(row.original.id, 'up'), 'Order updated')
              }
            >
              <ArrowUp className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              disabled={pending}
              aria-label={`Move ${row.original.title} down`}
              onClick={() =>
                run(() => moveBanner(row.original.id, 'down'), 'Order updated')
              }
            >
              <ArrowDown className="size-3.5" />
            </Button>
          </div>
        ),
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
                <span className="sr-only">Actions for {row.original.title}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Banner</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/admin/banners/${row.original.id}`}>Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  run(
                    () => setBannerActive(row.original.id, !row.original.active),
                    row.original.active ? 'Banner turned off' : 'Banner turned on',
                  )
                }
              >
                {row.original.active ? 'Turn off' : 'Turn on'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  if (!confirm(`Delete "${row.original.title}"?`)) return
                  run(() => deleteBanner(row.original.id), 'Banner deleted')
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
      data={banners}
      searchColumn="title"
      searchPlaceholder="Search banners…"
      facets={[
        {
          column: 'placement',
          label: 'Placement',
          options: Object.entries(PLACEMENT_LABEL).map(([value, label]) => ({
            value,
            label,
          })),
        },
        {
          column: 'status',
          label: 'Status',
          options: Object.entries(BANNER_STATUS_LABEL).map(([value, label]) => ({
            value,
            label,
          })),
        },
      ]}
      bulkActions={[
        {
          label: 'Turn on',
          onSelect: (rows) =>
            run(
              () => setBannersActive(rows.map((row) => row.id), true),
              `${rows.length} banner(s) turned on`,
            ),
        },
        {
          label: 'Turn off',
          onSelect: (rows) =>
            run(
              () => setBannersActive(rows.map((row) => row.id), false),
              `${rows.length} banner(s) turned off`,
            ),
        },
      ]}
      exportFileName="banners"
      emptyState={
        <Empty className="border-0">
          <EmptyHeader>
            <EmptyTitle>No banners yet</EmptyTitle>
            <EmptyDescription>
              Add one to take over the homepage hero — or run{' '}
              <code className="font-mono text-xs">pnpm db:seed</code> to restore
              the stock slides.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      }
    />
  )
}
