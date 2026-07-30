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
  BUSINESS_TYPE_LABEL,
  WHOLESALER_STATUS_CLASS,
  WHOLESALER_STATUS_LABEL,
  type WholesalerStatus,
} from '@/lib/admin/wholesaler-status'
import {
  deleteApplication,
  reviewApplication,
  setApplicationsStatus,
} from '@/app/actions/wholesalers'

export type WholesalerRowView = {
  id: string
  shopName: string
  contactName: string
  phone: string
  email: string
  city: string
  businessType: string
  businessTypeLabel: string
  /** Pre-formatted so sorting and CSV export both read well. */
  submitted: string
  products: number
  status: WholesalerStatus
}

export function WholesalersTable({
  applications,
}: {
  applications: WholesalerRowView[]
}) {
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

  const columns = useMemo<ColumnDef<WholesalerRowView, unknown>[]>(
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
            aria-label="Select all applications"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={`Select ${row.original.shopName}`}
          />
        ),
      },
      {
        accessorKey: 'shopName',
        meta: { label: 'Shop' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Shop" />
        ),
        cell: ({ row }) => (
          <Link
            href={`/admin/wholesalers/${row.original.id}`}
            className="font-medium text-foreground hover:underline"
          >
            {row.original.shopName}
          </Link>
        ),
      },
      {
        accessorKey: 'contactName',
        meta: { label: 'Contact' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Contact" />
        ),
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm">{row.original.contactName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.phone}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'email',
        meta: { label: 'Email' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Email" />
        ),
      },
      {
        accessorKey: 'city',
        meta: { label: 'City' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="City" />
        ),
      },
      {
        accessorKey: 'businessType',
        meta: { label: 'Type' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Type" />
        ),
        cell: ({ row }) => row.original.businessTypeLabel,
        filterFn: (row, id, value) => row.getValue(id) === value,
      },
      {
        accessorKey: 'products',
        meta: { label: 'Products' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Products" />
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
            className={`border-0 ${WHOLESALER_STATUS_CLASS[row.original.status]}`}
          >
            {WHOLESALER_STATUS_LABEL[row.original.status]}
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
                <span className="sr-only">
                  Actions for {row.original.shopName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Application</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/admin/wholesalers/${row.original.id}`}>
                  Review
                </Link>
              </DropdownMenuItem>
              {row.original.status !== 'approved' && (
                <DropdownMenuItem
                  disabled={pending}
                  onSelect={() =>
                    run(
                      () =>
                        reviewApplication({
                          id: row.original.id,
                          status: 'approved',
                        }),
                      `${row.original.shopName} approved`,
                    )
                  }
                >
                  Approve
                </DropdownMenuItem>
              )}
              {row.original.status === 'approved' && (
                <DropdownMenuItem
                  disabled={pending}
                  onSelect={() =>
                    run(
                      () =>
                        reviewApplication({
                          id: row.original.id,
                          status: 'suspended',
                        }),
                      `${row.original.shopName} suspended`,
                    )
                  }
                >
                  Suspend
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  if (
                    !confirm(
                      `Delete the application from "${row.original.shopName}"? Their orders stay on record.`,
                    )
                  ) {
                    return
                  }
                  run(
                    () => deleteApplication(row.original.id),
                    'Application deleted',
                  )
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
      data={applications}
      searchColumn="shopName"
      searchPlaceholder="Search shops…"
      facets={[
        {
          column: 'status',
          label: 'Status',
          options: Object.entries(WHOLESALER_STATUS_LABEL).map(
            ([value, label]) => ({ value, label }),
          ),
        },
        {
          column: 'businessType',
          label: 'Type',
          options: Object.entries(BUSINESS_TYPE_LABEL).map(
            ([value, label]) => ({ value, label }),
          ),
        },
      ]}
      bulkActions={[
        {
          label: 'Approve',
          onSelect: (rows) =>
            run(
              () =>
                setApplicationsStatus(
                  rows.map((r) => r.id),
                  'approved',
                ),
              `${rows.length} application(s) approved`,
            ),
        },
        {
          label: 'Reject',
          destructive: true,
          onSelect: (rows) =>
            run(
              () =>
                setApplicationsStatus(
                  rows.map((r) => r.id),
                  'rejected',
                ),
              `${rows.length} application(s) rejected`,
            ),
        },
      ]}
      exportFileName="wholesalers"
      emptyState={
        <Empty className="border-0">
          <EmptyHeader>
            <EmptyTitle>No applications yet</EmptyTitle>
            <EmptyDescription>
              Shoppers apply from /wholesale. New applications land here as
              pending.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      }
    />
  )
}
