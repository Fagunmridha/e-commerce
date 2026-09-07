'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { RoleToggle } from '@/components/admin/role-toggle'
import {
  RoleBadge,
  WholesaleRoleBadge,
} from '@/components/admin/customers/role-badges'
import { useLanguage } from '@/components/language-provider'
import type { WholesaleRole } from '@/lib/db/schema'

export type CustomerRowView = {
  id: number
  name: string
  email: string
  role: 'customer' | 'admin'
  wholesaleRole: WholesaleRole | null
  orderCount: number
  lifetimeValue: number
  lastOrderAt: string | null
  isSelf: boolean
}

export function CustomersTable({
  customers,
}: {
  customers: CustomerRowView[]
}) {
  const { price } = useLanguage()

  const columns = useMemo<ColumnDef<CustomerRowView, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        meta: { label: 'Name' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => (
          <Link
            href={`/admin/users/${row.original.id}`}
            className="text-sm font-medium text-foreground hover:text-primary hover:underline"
          >
            {row.original.name}
            {row.original.isSelf && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                (you)
              </span>
            )}
          </Link>
        ),
      },
      {
        accessorKey: 'email',
        meta: { label: 'Email' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Email" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.email}
          </span>
        ),
      },
      {
        accessorKey: 'role',
        meta: { label: 'Role' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Role" />
        ),
        cell: ({ row }) => <RoleBadge role={row.original.role} />,
        filterFn: (row, id, value) => row.getValue(id) === value,
      },
      {
        accessorKey: 'wholesaleRole',
        meta: { label: 'Wholesale' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Wholesale" />
        ),
        cell: ({ row }) => (
          <WholesaleRoleBadge role={row.original.wholesaleRole} />
        ),
        // `none` stands in for null in the facet, since a filter value of null
        // reads as "no filter" to the table.
        filterFn: (row, id, value) =>
          (row.getValue(id) ?? 'none') === value,
      },
      {
        accessorKey: 'orderCount',
        meta: { label: 'Orders' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Orders" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.orderCount}
          </span>
        ),
      },
      {
        accessorKey: 'lifetimeValue',
        meta: { label: 'Lifetime value' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Lifetime value" />
        ),
        cell: ({ row }) => (
          <span className="font-semibold whitespace-nowrap">
            {price(row.original.lifetimeValue)}
          </span>
        ),
      },
      {
        accessorKey: 'lastOrderAt',
        meta: { label: 'Last order' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Last order" />
        ),
        cell: ({ row }) => (
          <span className="text-sm whitespace-nowrap text-muted-foreground">
            {row.original.lastOrderAt
              ? new Date(row.original.lastOrderAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <RoleToggle
              userId={row.original.id}
              role={row.original.role}
              isSelf={row.original.isSelf}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">
                    Actions for {row.original.name}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Customer</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/users/${row.original.id}`}>
                    View profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    void navigator.clipboard.writeText(row.original.email)
                    toast.success('Email copied')
                  }}
                >
                  Copy email
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [price],
  )

  return (
    <DataTable
      columns={columns}
      data={customers}
      rowHref={(row) => `/admin/users/${row.id}`}
      searchColumn="email"
      searchPlaceholder="Search by email…"
      facets={[
        {
          column: 'role',
          label: 'Role',
          options: [
            { value: 'customer', label: 'Customer' },
            { value: 'admin', label: 'Admin' },
          ],
        },
        {
          column: 'wholesaleRole',
          label: 'Wholesale',
          options: [
            { value: 'buyer', label: 'Buyer' },
            { value: 'seller', label: 'Seller' },
            { value: 'none', label: 'Not joined' },
          ],
        },
      ]}
      exportFileName="customers"
      emptyState={
        <Empty className="border-0">
          <EmptyHeader>
            <EmptyTitle>No customers yet</EmptyTitle>
            <EmptyDescription>
              Accounts appear here as soon as someone signs up.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      }
    />
  )
}
