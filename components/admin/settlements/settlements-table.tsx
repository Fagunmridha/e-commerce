'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/admin/data-table/data-table'
import { DataTableColumnHeader } from '@/components/admin/data-table/column-header'
import {
  SETTLEMENT_STATUSES,
  SETTLEMENT_STATUS_CLASS,
  SETTLEMENT_STATUS_LABEL,
  type SettlementStatus,
} from '@/lib/admin/settlement-status'
import { formatPrice } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { ColumnDef } from '@tanstack/react-table'

/**
 * A settlement as the admin list renders it. Flat strings and numbers rather
 * than the DB row, so the CSV export the `DataTable` gives for free is readable
 * rather than a dump of Date objects.
 */
export type AdminSettlementRow = {
  id: string
  settlementNumber: string
  orderNumber: string
  shopName: string
  status: SettlementStatus
  gross: number
  commission: number
  payout: number
  /** Null when the shop's lines were sold at different rates. */
  commissionPct: number | null
  pieces: number
  /** ISO, or null when the order has not been delivered. */
  settledAt: string | null
  /** True when money went out on an order that is no longer delivered. */
  needsReconciling: boolean
}

function day(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const columns: ColumnDef<AdminSettlementRow, unknown>[] = [
  {
    accessorKey: 'settlementNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Settlement" />
    ),
    cell: ({ row }) => (
      <div className="min-w-0">
        <Link
          href={`/admin/settlements/${row.original.id}`}
          className="font-mono text-sm font-medium text-foreground hover:underline"
        >
          {row.original.settlementNumber}
        </Link>
        {row.original.needsReconciling && (
          <p className="mt-0.5 text-xs font-medium text-rose-600">
            Paid, but the order is not delivered
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'shopName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Shop" />,
    cell: ({ row }) => (
      <span className="text-foreground">{row.original.shopName}</span>
    ),
  },
  {
    accessorKey: 'orderNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Order" />
    ),
    cell: ({ row }) => (
      <Link
        href={`/admin/orders?q=${encodeURIComponent(row.original.orderNumber)}`}
        className="font-mono text-xs text-muted-foreground hover:underline"
      >
        {row.original.orderNumber}
      </Link>
    ),
  },
  {
    accessorKey: 'settledAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Delivered" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {day(row.original.settledAt)}
      </span>
    ),
  },
  {
    accessorKey: 'gross',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Goods value" />
    ),
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">
        {formatPrice(row.original.gross)}
      </span>
    ),
  },
  {
    accessorKey: 'commission',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Commission" />
    ),
    cell: ({ row }) => (
      <span className="tabular-nums text-foreground">
        {formatPrice(row.original.commission)}
        <span className="ml-1 text-xs text-muted-foreground">
          {row.original.commissionPct === null
            ? '(mixed)'
            : `(${row.original.commissionPct}%)`}
        </span>
      </span>
    ),
  },
  {
    accessorKey: 'payout',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Payout" />
    ),
    cell: ({ row }) => (
      <span className="font-semibold tabular-nums text-foreground">
        {formatPrice(row.original.payout)}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => (
      <Badge
        variant="secondary"
        className={cn('border-0', SETTLEMENT_STATUS_CLASS[row.original.status])}
      >
        {SETTLEMENT_STATUS_LABEL[row.original.status]}
      </Badge>
    ),
  },
]

export function SettlementsTable({ rows }: { rows: AdminSettlementRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      searchColumn="shopName"
      searchPlaceholder="Filter by shop…"
      exportFileName="settlements"
      facets={[
        {
          column: 'status',
          label: 'Status',
          options: SETTLEMENT_STATUSES.map((value) => ({
            value,
            label: SETTLEMENT_STATUS_LABEL[value],
          })),
        },
      ]}
      rowHref={(row) => `/admin/settlements/${row.id}`}
      pageSize={20}
    />
  )
}
