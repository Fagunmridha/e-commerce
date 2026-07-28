'use client'

import Link from 'next/link'
import { useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'
import { Copy, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
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
  COUPON_STATUS_CLASS,
  COUPON_STATUS_LABEL,
  type CouponStatus,
} from '@/lib/admin/coupon-status'
import {
  deleteCoupon,
  setCouponActive,
  setCouponsActive,
} from '@/app/actions/coupons'

export type CouponRowView = {
  id: string
  code: string
  type: 'percent' | 'fixed'
  /** Pre-formatted "20%" / "$10" so sorting and CSV export both read well. */
  value: string
  minOrder: string
  window: string
  usageLimit: number | null
  usageCount: number
  usage: string
  active: boolean
  featured: boolean
  status: CouponStatus
}

const TYPE_LABEL: Record<CouponRowView['type'], string> = {
  percent: 'Percentage',
  fixed: 'Fixed amount',
}

export function CouponsTable({ coupons }: { coupons: CouponRowView[] }) {
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

  const columns = useMemo<ColumnDef<CouponRowView, unknown>[]>(
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
            aria-label="Select all coupons"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={`Select ${row.original.code}`}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'code',
        meta: { label: 'Code' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Code" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Link
              href={`/admin/coupons/${row.original.id}`}
              className="font-mono text-sm font-semibold text-primary hover:underline"
            >
              {row.original.code}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label={`Copy ${row.original.code}`}
              onClick={() => {
                void navigator.clipboard.writeText(row.original.code)
                toast.success('Code copied')
              }}
            >
              <Copy className="size-3" />
            </Button>
            {/* Which codes are public is worth seeing at a glance. */}
            {row.original.featured && (
              <Badge
                variant="secondary"
                className="border-0 bg-primary/10 text-[10px] text-primary"
              >
                Homepage
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'value',
        meta: { label: 'Discount' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Discount" />
        ),
        cell: ({ row }) => (
          <span className="font-semibold">{row.original.value}</span>
        ),
      },
      {
        accessorKey: 'type',
        meta: { label: 'Type' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {TYPE_LABEL[row.original.type]}
          </span>
        ),
        filterFn: (row, id, value) => row.getValue(id) === value,
      },
      {
        accessorKey: 'minOrder',
        meta: { label: 'Min order' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Min order" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.minOrder}
          </span>
        ),
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
        accessorKey: 'usage',
        meta: { label: 'Used' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Used" />
        ),
        cell: ({ row }) => {
          const { usageCount, usageLimit, usage } = row.original
          return (
            <div className="min-w-24 space-y-1">
              <p className="text-xs text-muted-foreground">{usage}</p>
              {usageLimit !== null && (
                <Progress
                  value={Math.min(100, (usageCount / usageLimit) * 100)}
                  className="h-1.5"
                />
              )}
            </div>
          )
        },
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
            className={`border-0 ${COUPON_STATUS_CLASS[row.original.status]}`}
          >
            {COUPON_STATUS_LABEL[row.original.status]}
          </Badge>
        ),
        filterFn: (row, id, value) => row.getValue(id) === value,
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
                <span className="sr-only">Actions for {row.original.code}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Coupon</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/admin/coupons/${row.original.id}`}>Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={pending}
                onSelect={() =>
                  run(
                    () => setCouponActive(row.original.id, !row.original.active),
                    row.original.active ? 'Coupon turned off' : 'Coupon turned on',
                  )
                }
              >
                {row.original.active ? 'Turn off' : 'Turn on'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  if (
                    !confirm(
                      `Delete "${row.original.code}"? Past orders keep the code on record.`,
                    )
                  )
                    return
                  run(() => deleteCoupon(row.original.id), 'Coupon deleted')
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
      data={coupons}
      searchColumn="code"
      searchPlaceholder="Search codes…"
      facets={[
        {
          column: 'type',
          label: 'Type',
          options: Object.entries(TYPE_LABEL).map(([value, label]) => ({
            value,
            label,
          })),
        },
        {
          column: 'status',
          label: 'Status',
          options: Object.entries(COUPON_STATUS_LABEL).map(([value, label]) => ({
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
              () => setCouponsActive(rows.map((row) => row.id), true),
              `${rows.length} coupon(s) turned on`,
            ),
        },
        {
          label: 'Turn off',
          onSelect: (rows) =>
            run(
              () => setCouponsActive(rows.map((row) => row.id), false),
              `${rows.length} coupon(s) turned off`,
            ),
        },
      ]}
      exportFileName="coupons"
      emptyState={
        <Empty className="border-0">
          <EmptyHeader>
            <EmptyTitle>No coupons yet</EmptyTitle>
            <EmptyDescription>
              Create one and shoppers can enter it at checkout.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      }
    />
  )
}
