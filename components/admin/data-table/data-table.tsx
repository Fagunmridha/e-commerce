'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type Table as TanstackTable,
  type VisibilityState,
} from '@tanstack/react-table'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Search,
  Settings2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { downloadCsv, toCsv } from '@/lib/admin/export'
import { cn } from '@/lib/utils'

export type BulkAction<TData> = {
  label: string
  onSelect: (rows: TData[]) => void
  destructive?: boolean
}

export type FacetFilter = {
  /** Column id to filter on. */
  column: string
  label: string
  options: { value: string; label: string }[]
}

export type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  /** Column id the search box filters against. Omit to hide the search box. */
  searchColumn?: string
  searchPlaceholder?: string
  facets?: FacetFilter[]
  bulkActions?: BulkAction<TData>[]
  /** Base filename for the CSV/Excel export. Omit to hide the export button. */
  exportFileName?: string
  /** Shown in place of the table body when there are no rows at all. */
  emptyState?: React.ReactNode
  pageSize?: number
  /**
   * Where a row goes when clicked anywhere outside its own controls. Return
   * null for a row with no destination.
   *
   * This is a shortcut, not the only way in: every table that sets it also
   * renders a real `<Link>` in its first cell, which is what keyboard and
   * screen-reader users follow. That is why the row itself is not focusable —
   * making each one a tab stop would put a second, identical destination in
   * front of every row for no gain.
   */
  rowHref?: (row: TData) => string | null
}

/**
 * Anything inside a row that owns its own click: the select checkbox, the
 * actions menu, a status dropdown, the links in the cells. A click that starts
 * on one of these must not also navigate.
 */
const ROW_CONTROLS = 'a, button, input, select, textarea, [role="checkbox"]'

export function DataTable<TData>({
  columns,
  data,
  searchColumn,
  searchPlaceholder = 'Search…',
  facets,
  bulkActions,
  exportFileName,
  emptyState,
  pageSize = 10,
  rowHref,
}: DataTableProps<TData>) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: { pagination: { pageSize } },
  })

  const selectedRows = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original)
  const filtered = table.getState().columnFilters.length > 0

  const exportRows = () => {
    // Export what the user is looking at — current sort and filters applied —
    // and only the columns still visible.
    const headers = table
      .getVisibleLeafColumns()
      .filter((column) => column.id !== 'select' && column.id !== 'actions')
      .map((column) => ({
        key: column.id,
        label: typeof column.columnDef.meta === 'object' &&
          column.columnDef.meta !== null &&
          'label' in column.columnDef.meta
          ? String((column.columnDef.meta as { label: unknown }).label)
          : column.id,
      }))

    const source = selectedRows.length > 0 ? selectedRows : table.getSortedRowModel().rows.map((r) => r.original)

    downloadCsv(
      exportFileName ?? 'export',
      toCsv(source as Record<string, unknown>[], headers),
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {searchColumn && (
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={
                (table.getColumn(searchColumn)?.getFilterValue() as string) ?? ''
              }
              onChange={(event) =>
                table
                  .getColumn(searchColumn)
                  ?.setFilterValue(event.target.value)
              }
              placeholder={searchPlaceholder}
              className="h-9 pl-8"
            />
          </div>
        )}

        {facets?.map((facet) => {
          const column = table.getColumn(facet.column)
          if (!column) return null
          const value = (column.getFilterValue() as string) ?? 'all'

          return (
            <Select
              key={facet.column}
              value={value}
              onValueChange={(next) =>
                column.setFilterValue(next === 'all' ? undefined : next)
              }
            >
              <SelectTrigger className="h-9 w-auto min-w-36" size="sm">
                <SelectValue placeholder={facet.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {facet.label.toLowerCase()}</SelectItem>
                {facet.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        })}

        {filtered && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9"
            onClick={() => table.resetColumnFilters()}
          >
            Reset
            <X className="size-3.5" />
          </Button>
        )}

        <div className="ml-auto flex items-center gap-2">
          {bulkActions?.length && selectedRows.length > 0 ? (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedRows.length} selected
              </span>
              {bulkActions.map((action) => (
                <Button
                  key={action.label}
                  size="sm"
                  variant={action.destructive ? 'destructive' : 'outline'}
                  className="h-9"
                  onClick={() => {
                    action.onSelect(selectedRows)
                    setRowSelection({})
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </>
          ) : null}

          {exportFileName && (
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={exportRows}
            >
              <Download className="size-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Settings2 className="size-3.5" />
                <span className="hidden sm:inline">Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    className="capitalize"
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="relative max-h-[70vh] overflow-auto rounded-xl border border-border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {group.headers.map((header) => (
                  <TableHead key={header.id} className="h-10 whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => {
                const href = rowHref?.(row.original) ?? null

                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className={cn('transition-colors', href && 'cursor-pointer')}
                    onClick={
                      href
                        ? (event) => {
                            const target = event.target as HTMLElement
                            if (target.closest(ROW_CONTROLS)) return
                            // Dragging across a cell to copy an order number
                            // ends in a click; navigating away from the
                            // selection would undo the work.
                            if (window.getSelection()?.toString()) return

                            // Keep the open-in-a-new-tab habit working, which a
                            // bare router.push() would swallow.
                            if (event.metaKey || event.ctrlKey) {
                              window.open(href, '_blank', 'noopener')
                              return
                            }
                            router.push(href)
                          }
                        : undefined
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2.5">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-64 p-0">
                  {data.length === 0 && emptyState ? (
                    emptyState
                  ) : (
                    <div className="grid h-64 place-items-center text-sm text-muted-foreground">
                      No results match your filters.
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  )
}

function DataTablePagination<TData>({
  table,
}: {
  table: TanstackTable<TData>
}) {
  const selected = table.getFilteredSelectedRowModel().rows.length
  const total = table.getFilteredRowModel().rows.length

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        {selected > 0 ? `${selected} of ${total} row(s) selected` : `${total} row(s)`}
      </p>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows</span>
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger size="sm" className="h-8 w-[4.5rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <span className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {Math.max(table.getPageCount(), 1)}
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label="First page"
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            aria-label="Last page"
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Matching skeleton for `loading.tsx` files. */
export function DataTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className={cn('flex flex-col gap-3')}>
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="ml-auto h-9 w-24" />
      </div>
      <div className="rounded-xl border border-border">
        <Skeleton className="h-10 w-full rounded-b-none" />
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="border-t border-border p-3">
            <Skeleton className="h-6 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
