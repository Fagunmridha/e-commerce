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
import { useLanguage } from '@/components/language-provider'

export type CustomerRowView = {
  id: number
  name: string
  email: string
  role: 'customer' | 'admin'
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
        accessorKey: 'role',
        meta: { label: 'Role' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Role" />
        ),
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={
              row.original.role === 'admin'
                ? 'border-0 bg-primary/10 capitalize text-primary'
                : 'border-0 bg-muted capitalize text-muted-foreground'
            }
          >
            {row.original.role}
          </Badge>
        ),
        filterFn: (row, id, value) => row.getValue(id) === value,
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
