'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'
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
import { useLanguage } from '@/components/language-provider'
import { PAYMENT_LABEL } from '@/lib/order'
import type { RecentOrder } from '@/lib/admin/stats'

const STATUS_VARIANT: Record<
  RecentOrder['status'],
  { label: string; className: string }
> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-500/12 text-amber-700',
  },
  processing: {
    label: 'Processing',
    className: 'bg-sky-500/12 text-sky-700',
  },
  shipped: {
    label: 'Shipped',
    className: 'bg-violet-500/12 text-violet-700',
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-emerald-500/12 text-emerald-700',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-rose-500/12 text-rose-700',
  },
}


export function RecentOrdersTable({ orders }: { orders: RecentOrder[] }) {
  const { price } = useLanguage()

  const columns = useMemo<ColumnDef<RecentOrder, unknown>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all orders"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={`Select order ${row.original.orderNumber}`}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'orderNumber',
        meta: { label: 'Order' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Order" />
        ),
        cell: ({ row }) => (
          // The order itself, matching what clicking the row does. The menu
          // still carries "View in orders" for the filtered list.
          <Link
            href={`/admin/orders/${row.original.id}`}
            className="font-mono text-xs font-semibold text-primary hover:underline"
          >
            {row.original.orderNumber}
          </Link>
        ),
      },
      {
        accessorKey: 'customer',
        meta: { label: 'Customer' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Customer" />
        ),
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {row.original.customer}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.phone}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'items',
        meta: { label: 'Items' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Items" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.items}
          </span>
        ),
      },
      {
        accessorKey: 'paymentMethod',
        meta: { label: 'Payment' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Payment" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {PAYMENT_LABEL[row.original.paymentMethod]}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        meta: { label: 'Status' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const status = STATUS_VARIANT[row.original.status]
          return (
            <Badge
              variant="secondary"
              className={`border-0 ${status.className}`}
            >
              {status.label}
            </Badge>
          )
        },
        filterFn: (row, id, value) => row.getValue(id) === value,
      },
      {
        accessorKey: 'total',
        meta: { label: 'Amount' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Amount" />
        ),
        cell: ({ row }) => (
          <span className="font-semibold">{price(row.original.total)}</span>
        ),
      },
      {
        accessorKey: 'placedAt',
        meta: { label: 'Date' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Date" />
        ),
        cell: ({ row }) => (
          <span className="text-sm whitespace-nowrap text-muted-foreground">
            {new Date(row.original.placedAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
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
                <span className="sr-only">
                  Actions for {row.original.orderNumber}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Order</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/admin/orders?q=${row.original.orderNumber}`}>
                  View in orders
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() =>
                  navigator.clipboard.writeText(row.original.orderNumber)
                }
              >
                Copy order number
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [price],
  )

  return (
    <DataTable
      columns={columns}
      data={orders}
      rowHref={(row) => `/admin/orders/${row.id}`}
      searchColumn="customer"
      searchPlaceholder="Search customer…"
      facets={[
        {
          column: 'status',
          label: 'Status',
          options: Object.entries(STATUS_VARIANT).map(([value, meta]) => ({
            value,
            label: meta.label,
          })),
        },
      ]}
      exportFileName="recent-orders"
      pageSize={10}
      emptyState={
        <Empty className="border-0">
          <EmptyHeader>
            <EmptyTitle>No orders yet</EmptyTitle>
            <EmptyDescription>
              Orders placed on the storefront show up here straight away.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      }
    />
  )
}
