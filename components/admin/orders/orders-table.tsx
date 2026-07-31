'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { OrderStatusSelect } from '@/components/admin/order-status-select'
import { useLanguage } from '@/components/language-provider'
import type { OrderStatus } from '@/lib/orders'

export type AdminOrderRow = {
  id: string
  orderNumber: string
  customer: string
  phone: string
  itemCount: number
  subtotal: number
  discount: number
  couponCode: string | null
  total: number
  paymentMethod: 'cod' | 'mobile' | 'card'
  status: OrderStatus
  /** Every line is upcoming stock — this order is waiting on a delivery date. */
  preorder: boolean
  placedAt: string
}

const STATUS_VARIANT: Record<OrderStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-500/12 text-amber-700 dark:text-amber-400',
  },
  processing: {
    label: 'Processing',
    className: 'bg-sky-500/12 text-sky-700 dark:text-sky-400',
  },
  shipped: {
    label: 'Shipped',
    className: 'bg-violet-500/12 text-violet-700 dark:text-violet-400',
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-rose-500/12 text-rose-700 dark:text-rose-400',
  },
}

const PAYMENT_LABEL: Record<AdminOrderRow['paymentMethod'], string> = {
  cod: 'Cash on delivery',
  mobile: 'Mobile banking',
  card: 'Card',
}

export function OrdersTable({ orders }: { orders: AdminOrderRow[] }) {
  const { price } = useLanguage()

  const columns = useMemo<ColumnDef<AdminOrderRow, unknown>[]>(
    () => [
      {
        accessorKey: 'orderNumber',
        meta: { label: 'Order' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Order" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/orders/${row.original.id}`}
              className="font-mono text-xs font-semibold text-primary hover:underline"
            >
              {row.original.orderNumber}
            </Link>
            {/* Flagged in the list, not just on the detail page: a pre-order
                sits at "pending" for weeks by design, and without this it
                looks like an order someone forgot to fulfil. */}
            {row.original.preorder && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                Pre-order
              </span>
            )}
          </div>
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
            <p className="truncate text-sm font-medium">{row.original.customer}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.phone}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'itemCount',
        meta: { label: 'Items' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Items" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.itemCount}
          </span>
        ),
      },
      {
        accessorKey: 'discount',
        meta: { label: 'Discount' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Discount" />
        ),
        cell: ({ row }) =>
          row.original.discount > 0 ? (
            <div className="whitespace-nowrap">
              <span className="text-sm font-medium text-badge-new">
                −{price(row.original.discount)}
              </span>
              {row.original.couponCode && (
                <span className="ml-1 font-mono text-xs text-muted-foreground">
                  {row.original.couponCode}
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: 'total',
        meta: { label: 'Total' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Total" />
        ),
        cell: ({ row }) => (
          <span className="font-semibold whitespace-nowrap">
            {price(row.original.total)}
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
        filterFn: (row, id, value) => row.getValue(id) === value,
      },
      {
        accessorKey: 'status',
        meta: { label: 'Status' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        // Editable inline — the pills above are for filtering, this is the
        // control that actually moves an order along.
        cell: ({ row }) => (
          <OrderStatusSelect
            orderId={row.original.id}
            status={row.original.status}
          />
        ),
      },
      {
        accessorKey: 'placedAt',
        meta: { label: 'Placed' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Placed" />
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
                <Link href={`/admin/orders/${row.original.id}`}>
                  View details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  void navigator.clipboard.writeText(row.original.orderNumber)
                  toast.success('Order number copied')
                }}
              >
                Copy order number
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  void navigator.clipboard.writeText(row.original.phone)
                  toast.success('Phone copied')
                }}
              >
                Copy phone
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
      facets={[
        {
          column: 'paymentMethod',
          label: 'Payment',
          options: Object.entries(PAYMENT_LABEL).map(([value, label]) => ({
            value,
            label,
          })),
        },
      ]}
      exportFileName="orders"
      pageSize={20}
      emptyState={
        <Empty className="border-0">
          <EmptyHeader>
            <EmptyTitle>No orders here</EmptyTitle>
            <EmptyDescription>
              Nothing matches this filter yet.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      }
    />
  )
}

export { STATUS_VARIANT }
