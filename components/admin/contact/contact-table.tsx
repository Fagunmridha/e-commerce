'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import { Mail, MoreHorizontal, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  CONTACT_STATUS_CLASS,
  CONTACT_STATUS_LABEL,
} from '@/lib/admin/contact-status'
import {
  deleteContactMessage,
  setContactMessageNote,
  setContactMessageStatus,
  setContactMessagesStatus,
} from '@/app/actions/contact'
import type { AdminContactRow } from '@/lib/contact'

/**
 * The inbox is deliberately read-only: it shows a message and records what was
 * done about it, but nothing here composes a reply. The team answers from their
 * own mail client, so the address and phone number are presented as text to
 * copy rather than as links that hand the message to whatever app the browser
 * happens to have registered.
 */
export function ContactTable({ messages }: { messages: AdminContactRow[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState<AdminContactRow | null>(null)
  const [note, setNote] = useState('')

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

  /**
   * Opening a message is what marks it read — an admin who has the text on
   * screen has read it, and making them say so again is a click that only ever
   * gets forgotten, leaving a permanently overstated bell count.
   */
  function openMessage(row: AdminContactRow) {
    setOpen(row)
    setNote(row.adminNote ?? '')
    if (row.status === 'new') {
      startTransition(async () => {
        try {
          await setContactMessageStatus({ id: row.id, status: 'read' })
          router.refresh()
        } catch {
          // Silent: failing to flip a status must not interrupt reading.
        }
      })
    }
  }

  const columns = useMemo<ColumnDef<AdminContactRow, unknown>[]>(
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
            aria-label="Select all messages"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={`Select message from ${row.original.name}`}
          />
        ),
      },
      {
        accessorKey: 'name',
        meta: { label: 'From' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="From" />
        ),
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {row.original.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.email}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'phone',
        meta: { label: 'Phone' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Phone" />
        ),
        cell: ({ row }) => (
          <span className="text-sm whitespace-nowrap">{row.original.phone}</span>
        ),
      },
      {
        accessorKey: 'subject',
        meta: { label: 'Subject' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Subject" />
        ),
        cell: ({ row }) => (
          // The whole point of the row: opens the message rather than
          // truncating it into uselessness in the cell.
          <button
            type="button"
            onClick={() => openMessage(row.original)}
            className="max-w-xs truncate text-left text-sm font-medium text-foreground hover:underline"
          >
            {row.original.subject}
          </button>
        ),
      },
      {
        accessorKey: 'message',
        meta: { label: 'Message' },
        enableSorting: false,
        header: 'Message',
        cell: ({ row }) => (
          <p
            className="line-clamp-2 max-w-md whitespace-normal text-sm text-muted-foreground"
            title={row.original.message}
          >
            {row.original.message}
          </p>
        ),
      },
      {
        accessorKey: 'received',
        meta: { label: 'Received' },
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Received" />
        ),
        cell: ({ row }) => (
          <span
            className="whitespace-nowrap text-sm"
            title={new Date(row.original.receivedAt).toLocaleString('en-GB')}
          >
            {row.original.received}
          </span>
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
            className={`border-0 ${CONTACT_STATUS_CLASS[row.original.status]}`}
          >
            {CONTACT_STATUS_LABEL[row.original.status]}
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
                  Actions for the message from {row.original.name}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Message</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => openMessage(row.original)}>
                Read message
              </DropdownMenuItem>
              {row.original.userId && (
                <DropdownMenuItem asChild>
                  <Link href={`/admin/users/${row.original.userId}`}>
                    View customer
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {row.original.status !== 'replied' && (
                <DropdownMenuItem
                  disabled={pending}
                  onSelect={() =>
                    run(
                      () =>
                        setContactMessageStatus({
                          id: row.original.id,
                          status: 'replied',
                        }),
                      'Marked as replied',
                    )
                  }
                >
                  Mark replied
                </DropdownMenuItem>
              )}
              {row.original.status !== 'archived' ? (
                <DropdownMenuItem
                  disabled={pending}
                  onSelect={() =>
                    run(
                      () =>
                        setContactMessageStatus({
                          id: row.original.id,
                          status: 'archived',
                        }),
                      'Message archived',
                    )
                  }
                >
                  Archive
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  disabled={pending}
                  onSelect={() =>
                    run(
                      () =>
                        setContactMessageStatus({
                          id: row.original.id,
                          status: 'new',
                        }),
                      'Moved back to the inbox',
                    )
                  }
                >
                  Move back to inbox
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={pending}
                onSelect={() => {
                  if (
                    !confirm(
                      `Delete the message from ${row.original.name}? This cannot be undone — archive it instead if you only want it out of the way.`,
                    )
                  ) {
                    return
                  }
                  run(
                    () => deleteContactMessage(row.original.id),
                    'Message deleted',
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
    <>
      <DataTable
        columns={columns}
        data={messages}
        searchColumn="name"
        searchPlaceholder="Search senders…"
        facets={[
          {
            column: 'status',
            label: 'Status',
            options: Object.entries(CONTACT_STATUS_LABEL).map(
              ([value, label]) => ({ value, label }),
            ),
          },
        ]}
        bulkActions={[
          {
            label: 'Mark replied',
            onSelect: (rows) =>
              run(
                () =>
                  setContactMessagesStatus({
                    ids: rows.map((r) => r.id),
                    status: 'replied',
                  }),
                `${rows.length} message(s) marked replied`,
              ),
          },
          {
            label: 'Archive',
            destructive: true,
            onSelect: (rows) =>
              run(
                () =>
                  setContactMessagesStatus({
                    ids: rows.map((r) => r.id),
                    status: 'archived',
                  }),
                `${rows.length} message(s) archived`,
              ),
          },
        ]}
        exportFileName="contact-messages"
        emptyState={
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyTitle>No messages yet</EmptyTitle>
              <EmptyDescription>
                Anything sent from the contact form on the storefront lands here,
                with the sender’s email and phone number.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        }
      />

      <Dialog
        open={open !== null}
        onOpenChange={(next) => !next && setOpen(null)}
      >
        <DialogContent className="max-w-2xl">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-6">{open.subject}</DialogTitle>
                <DialogDescription>
                  From {open.name} ·{' '}
                  {new Date(open.receivedAt).toLocaleString('en-GB')}
                </DialogDescription>
              </DialogHeader>

              {/* Selectable text, not links — see the note on this component.
                  These are what you copy into whichever mail client or phone
                  you actually answer from. */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm select-all">
                  <Mail className="size-4 shrink-0 text-muted-foreground" />
                  {open.email}
                </span>
                <span className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm select-all">
                  <Phone className="size-4 shrink-0 text-muted-foreground" />
                  {open.phone}
                </span>
                <Badge
                  variant="secondary"
                  className={`border-0 ${CONTACT_STATUS_CLASS[open.status]}`}
                >
                  {CONTACT_STATUS_LABEL[open.status]}
                </Badge>
              </div>

              {/* `whitespace-pre-wrap` because the customer's paragraph breaks
                  are part of what they wrote. */}
              <p className="max-h-64 overflow-y-auto rounded-lg border border-border bg-muted/40 p-3 text-sm whitespace-pre-wrap text-foreground">
                {open.message}
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="contact-note">Internal note</Label>
                <Textarea
                  id="contact-note"
                  rows={2}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Only your team sees this — e.g. refunded, see order #1042"
                />
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                <Button
                  variant="outline"
                  disabled={pending || note === (open.adminNote ?? '')}
                  onClick={() =>
                    run(
                      () => setContactMessageNote({ id: open.id, note }),
                      'Note saved',
                    )
                  }
                >
                  Save note
                </Button>
                {/* Records that someone answered elsewhere — it sends nothing. */}
                <Button
                  disabled={pending || open.status === 'replied'}
                  onClick={() => {
                    run(
                      () =>
                        setContactMessageStatus({
                          id: open.id,
                          status: 'replied',
                        }),
                      'Marked as replied',
                    )
                    setOpen(null)
                  }}
                >
                  Mark replied
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
