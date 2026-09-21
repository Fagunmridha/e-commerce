'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, Pencil, Plus, Power, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingOverlay } from '@/components/loading-overlay'
import {
  createWholesaleCatalogue,
  createWholesaleCategory,
  createWholesaleType,
  renameWholesaleNode,
  toggleWholesaleNodeStatus,
} from '@/app/actions/wholesale-admin'
import { deleteCategory } from '@/app/actions/categories'
import { deleteCatalogue } from '@/app/actions/catalogues'
import type { WholesaleNodeDetail } from '@/lib/wholesale/dashboard'
import { cn } from '@/lib/utils'
import { nodeName, SLUG_PATTERN, slugify } from './catalog-helpers'

const CATALOG_HOME = '/admin/wholesale/catalog'

const SELECT_CLASS =
  'h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'

/**
 * Runs one server action with the shared "saving" overlay and a toast either
 * way. The server throws a sentence an admin can act on — a taken slug, a
 * duplicate name, a non-empty delete — so it is shown as written.
 *
 * Resolves to whether it worked, so a form can stay open (keeping what was
 * typed) on a failure and close on success.
 */
function useNodeAction() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function run(
    task: () => Promise<void>,
    success: string,
    /** Where to go afterwards; omitted means stay and re-read this page. */
    to?: string,
  ): Promise<boolean> {
    setPending(true)
    try {
      await task()
      toast.success(success)
      // Navigating fetches the destination fresh; refreshing as well would race
      // it, and after a delete would re-read the row that no longer exists.
      if (to) router.push(to)
      else router.refresh()
      return true
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not save that change',
      )
      return false
    } finally {
      setPending(false)
    }
  }

  return { pending, run }
}

type Run = ReturnType<typeof useNodeAction>['run']

/* -------------------------------------------------------------------------- */
/* The open node                                                               */
/* -------------------------------------------------------------------------- */

const KIND_COPY = {
  type: {
    label: 'Trade line',
    blurb:
      'A wholesaler picks one of these when they apply. Once a shop is approved for it, the shop can list products in the categories below.',
    child: {
      heading: 'Categories',
      noun: 'category',
      hint: 'Where products are filed — for Cloth: Men, Women, Kids.',
      empty: 'No categories yet. A trade line with none cannot take products.',
    },
  },
  category: {
    label: 'Category',
    blurb:
      'Products are filed under a category. A seller reaches it after picking the trade line it sits in.',
    child: {
      heading: 'Catalogues',
      noun: 'catalogue',
      hint: 'The finest level — for Men: Jeans, Shirt, Panjabi, T-shirt.',
      empty: 'No catalogues yet. Products here show under “All”.',
    },
  },
  catalogue: {
    label: 'Catalogue',
    blurb:
      'The last level of the tree. A seller files each product under exactly one catalogue.',
    child: null,
  },
} as const

/**
 * The right-hand panel for a selected node: what it is, its numbers, the things
 * that can be done to it (rename, switch off, delete) and — for a trade line or
 * a category — the form that adds the next level down.
 *
 * The parent of a new child is never chosen from a drop-down: it is the node
 * that is open. That is the point of the tree, and it removes the one mistake a
 * flat form invites — filing something under the wrong parent.
 */
export function CatalogNodePanel({ node }: { node: WholesaleNodeDetail }) {
  const { pending, run } = useNodeAction()
  const [renaming, setRenaming] = useState(false)

  const copy = KIND_COPY[node.kind]
  const inactive = node.row.status === 'inactive'
  const name = node.row.name

  return (
    <section className="min-w-0 space-y-6">
      <LoadingOverlay show={pending} label="Saving…" />

      <Card>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {copy.label}
              </p>
              <h2 className="mt-1 text-xl font-semibold capitalize text-foreground">
                {nodeName(name)}
                {name.bn && (
                  <span className="ml-2 text-base font-normal normal-case text-muted-foreground">
                    {name.bn}
                  </span>
                )}
              </h2>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <code>{node.row.slug}</code>
                {node.kind === 'type' && (
                  <span>
                    ·{' '}
                    {node.row.scope === 'both'
                      ? 'Shop + Wholesale'
                      : 'Wholesale only'}
                  </span>
                )}
              </p>
            </div>
            <StatusPill inactive={inactive} />
          </div>

          <p className="text-sm text-muted-foreground">{copy.blurb}</p>

          <Stats node={node} />

          {inactive && (
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              Switched off: hidden from every picker and filter. Products
              already filed here keep it — nothing is lost, and switching it
              back on restores it.
            </p>
          )}

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRenaming((open) => !open)}
              aria-expanded={renaming}
            >
              <Pencil className="size-4" aria-hidden />
              Rename
            </Button>
            <StatusButton node={node} run={run} />
            <DeleteButton node={node} run={run} />
          </div>
          <DeleteHint node={node} />
        </CardContent>
      </Card>

      {renaming && (
        <RenameForm
          key={node.row.slug}
          node={node}
          run={run}
          onDone={() => setRenaming(false)}
        />
      )}

      {node.kind !== 'catalogue' && (
        <ChildrenCard node={node} run={run} />
      )}
    </section>
  )
}

function StatusPill({ inactive }: { inactive: boolean }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium',
        inactive
          ? 'bg-muted text-muted-foreground'
          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
      )}
    >
      {inactive ? 'Off' : 'Active'}
    </span>
  )
}

function Stats({ node }: { node: WholesaleNodeDetail }) {
  const items: { label: string; value: number }[] =
    node.kind === 'type'
      ? [
          { label: 'Categories', value: node.row.children.length },
          { label: 'Products', value: node.row.productCount },
          { label: 'Approved shops', value: node.row.sellerCount },
        ]
      : node.kind === 'category'
        ? [
            { label: 'Catalogues', value: node.row.catalogues.length },
            { label: 'Products', value: node.row.productCount },
          ]
        : [{ label: 'Products', value: node.row.productCount }]

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-md border border-border px-3 py-2"
        >
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className="text-lg font-semibold tabular-nums text-foreground">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/* -------------------------------------------------------------------------- */
/* Switch on/off and delete                                                    */
/* -------------------------------------------------------------------------- */

function StatusButton({ node, run }: { node: WholesaleNodeDetail; run: Run }) {
  const inactive = node.row.status === 'inactive'
  const toggle = () =>
    run(
      () => toggleWholesaleNodeStatus({ kind: node.kind, slug: node.row.slug }),
      inactive ? 'Switched on' : 'Switched off',
    )

  // Switching on restores something; it needs no second thought.
  if (inactive) {
    return (
      <Button variant="outline" size="sm" onClick={toggle}>
        <Power className="size-4" aria-hidden />
        Switch on
      </Button>
    )
  }

  return (
    <ConfirmButton
      trigger={
        <>
          <Power className="size-4" aria-hidden />
          Switch off
        </>
      }
      title={`Switch off “${nodeName(node.row.name)}”?`}
      description={
        node.kind === 'type'
          ? 'It disappears from the apply form and from every seller’s product form, along with the categories under it. Shops already approved for it keep the approval, and live products stay as they are.'
          : 'It disappears from every picker and filter, so nothing new can be filed here. Products already filed under it stay where they are.'
      }
      confirmLabel="Switch off"
      onConfirm={toggle}
    />
  )
}

/**
 * What blocks a delete, or null when the row is free to go. The server refuses
 * the same cases; this is here so the button says why before it is clicked.
 */
function deleteBlocker(node: WholesaleNodeDetail): string | null {
  if (node.kind === 'type' && node.row.children.length > 0) {
    const n = node.row.children.length
    return `Has ${n} categor${n === 1 ? 'y' : 'ies'} — delete or move ${n === 1 ? 'it' : 'them'} first, or switch this trade line off instead.`
  }
  if (node.kind !== 'type' && node.row.productCount > 0) {
    const n = node.row.productCount
    return `Holds ${n} product${n === 1 ? '' : 's'} — move ${n === 1 ? 'it' : 'them'} first, or switch this off instead.`
  }
  return null
}

function DeleteHint({ node }: { node: WholesaleNodeDetail }) {
  const blocker = deleteBlocker(node)
  if (!blocker) return null

  return <p className="text-xs text-muted-foreground">Delete: {blocker}</p>
}

function DeleteButton({ node, run }: { node: WholesaleNodeDetail; run: Run }) {
  const blocked = deleteBlocker(node) !== null

  const goTo =
    node.kind === 'catalogue'
      ? `${CATALOG_HOME}/category/${node.row.categorySlug}`
      : node.kind === 'category' && node.row.parentSlug
        ? `${CATALOG_HOME}/type/${node.row.parentSlug}`
        : CATALOG_HOME

  const consequence =
    node.kind === 'type' && node.row.sellerCount > 0
      ? ` ${node.row.sellerCount} approved shop${node.row.sellerCount === 1 ? '' : 's'} will lose this trade line.`
      : node.kind === 'category' && node.row.catalogues.length > 0
        ? ` Its ${node.row.catalogues.length} catalogue${node.row.catalogues.length === 1 ? '' : 's'} will be deleted with it.`
        : ''

  return (
    <ConfirmButton
      destructive
      disabled={blocked}
      trigger={
        <>
          <Trash2 className="size-4" aria-hidden />
          Delete
        </>
      }
      title={`Delete “${nodeName(node.row.name)}”?`}
      description={`This cannot be undone.${consequence}`}
      confirmLabel="Delete"
      onConfirm={() =>
        run(
          () =>
            node.kind === 'catalogue'
              ? deleteCatalogue(node.row.slug)
              : deleteCategory(node.row.slug),
          'Deleted',
          goTo,
        )
      }
    />
  )
}

function ConfirmButton({
  trigger,
  title,
  description,
  confirmLabel,
  onConfirm,
  destructive,
  disabled,
}: {
  trigger: React.ReactNode
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  destructive?: boolean
  disabled?: boolean
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn(
            destructive &&
              'text-destructive hover:bg-destructive/10 hover:text-destructive',
          )}
        >
          {trigger}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              destructive ? buttonVariants({ variant: 'destructive' }) : undefined
            }
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/* -------------------------------------------------------------------------- */
/* Rename                                                                      */
/* -------------------------------------------------------------------------- */

function RenameForm({
  node,
  run,
  onDone,
}: {
  node: WholesaleNodeDetail
  run: Run
  onDone: () => void
}) {
  const id = useId()
  const [en, setEn] = useState(node.row.name.en ?? '')
  const [bn, setBn] = useState(node.row.name.bn ?? '')
  const valid = en.trim() !== '' && bn.trim() !== ''

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!valid) return
    const ok = await run(
      () =>
        renameWholesaleNode({
          kind: node.kind,
          slug: node.row.slug,
          name: { en: en.trim(), bn: bn.trim() },
        }),
      'Renamed',
    )
    if (ok) onDone()
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-lg border border-border bg-card p-4"
    >
      <div>
        <h3 className="text-sm font-semibold">Rename</h3>
        <p className="text-xs text-muted-foreground">
          Only the label changes. The slug <code>{node.row.slug}</code> is the
          URL and what products point at, so it stays.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-en`}>Name (English)</Label>
          <Input
            id={`${id}-en`}
            value={en}
            onChange={(e) => setEn(e.target.value)}
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-bn`}>Name (Bangla)</Label>
          <Input
            id={`${id}-bn`}
            value={bn}
            onChange={(e) => setBn(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-3">
        <Button type="submit" size="sm" disabled={!valid}>
          Save
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onDone}>
          <X className="size-4" aria-hidden />
          Cancel
        </Button>
      </div>
    </form>
  )
}

/* -------------------------------------------------------------------------- */
/* Children: the list, and the form that adds the next one                     */
/* -------------------------------------------------------------------------- */

function ChildrenCard({
  node,
  run,
}: {
  node: Exclude<WholesaleNodeDetail, { kind: 'catalogue' }>
  run: Run
}) {
  const copy = KIND_COPY[node.kind].child
  if (!copy) return null

  const rows =
    node.kind === 'type'
      ? node.row.children.map((child) => ({
          slug: child.slug,
          name: child.name,
          status: child.status,
          href: `${CATALOG_HOME}/category/${child.slug}`,
        }))
      : node.row.catalogues.map((child) => ({
          slug: child.slug,
          name: child.name,
          status: child.status,
          href: `${CATALOG_HOME}/catalogue/${child.slug}`,
        }))

  return (
    <Card>
      <CardContent className="space-y-5">
        <div>
          <h3 className="text-base font-semibold">
            {copy.heading}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {rows.length}
            </span>
          </h3>
          <p className="text-xs text-muted-foreground">{copy.hint}</p>
        </div>

        {rows.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
            {copy.empty}
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {rows.map((row) => (
              <li key={row.slug}>
                <Link
                  href={row.href}
                  className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted"
                >
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium capitalize">
                      {nodeName(row.name)}
                    </span>
                    {row.name.bn && (
                      <span className="ml-2 text-muted-foreground">
                        {row.name.bn}
                      </span>
                    )}
                  </span>
                  {row.status === 'inactive' && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                      off
                    </span>
                  )}
                  <code className="hidden text-xs text-muted-foreground sm:inline">
                    {row.slug}
                  </code>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}

        <AddChildForm
          // Remount per parent so opening another node starts from a clean form.
          key={node.row.slug}
          node={node}
          noun={copy.noun}
          run={run}
        />
      </CardContent>
    </Card>
  )
}

/**
 * Name + slug state shared by the three create forms. The slug follows the
 * English name until the admin types one of their own, and follows it again if
 * they clear the field — so the common case is two fields to fill in, not three.
 */
function useNameFields() {
  const [en, setEn] = useState('')
  const [bn, setBn] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)

  return {
    en,
    bn,
    slug,
    slugValid: SLUG_PATTERN.test(slug),
    complete: en.trim() !== '' && bn.trim() !== '' && SLUG_PATTERN.test(slug),
    setEn(value: string) {
      setEn(value)
      if (!slugEdited) setSlug(slugify(value))
    },
    setBn,
    setSlug(value: string) {
      const next = value.toLowerCase().replace(/\s+/g, '-')
      setSlug(next)
      setSlugEdited(next !== '')
    },
    reset() {
      setEn('')
      setBn('')
      setSlug('')
      setSlugEdited(false)
    },
  }
}

type NameFields = ReturnType<typeof useNameFields>

function NameFieldsGrid({
  id,
  fields,
  placeholders,
  slugHint,
  autoFocus,
}: {
  id: string
  fields: NameFields
  placeholders: { en: string; bn: string; slug: string }
  slugHint: string
  autoFocus?: boolean
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-en`}>Name (English)</Label>
        <Input
          id={`${id}-en`}
          value={fields.en}
          onChange={(e) => fields.setEn(e.target.value)}
          placeholder={placeholders.en}
          autoFocus={autoFocus}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-bn`}>Name (Bangla)</Label>
        <Input
          id={`${id}-bn`}
          value={fields.bn}
          onChange={(e) => fields.setBn(e.target.value)}
          placeholder={placeholders.bn}
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={`${id}-slug`}>Slug</Label>
        <Input
          id={`${id}-slug`}
          value={fields.slug}
          onChange={(e) => fields.setSlug(e.target.value)}
          placeholder={placeholders.slug}
          aria-invalid={fields.slug !== '' && !fields.slugValid}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          {fields.slug !== '' && !fields.slugValid
            ? 'Use lower-case letters, numbers or hyphens only.'
            : slugHint}
        </p>
      </div>
    </div>
  )
}

/**
 * Adds the next level under the open node — a category under a trade line, a
 * catalogue under a category. Starts collapsed behind a button so the list above
 * stays the first thing on the panel.
 */
function AddChildForm({
  node,
  noun,
  run,
}: {
  node: Exclude<WholesaleNodeDetail, { kind: 'catalogue' }>
  noun: string
  run: Run
}) {
  const id = useId()
  const fields = useNameFields()
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden />
        Add {noun}
      </Button>
    )
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!fields.complete) return

    const name = { en: fields.en.trim(), bn: fields.bn.trim() }
    const ok = await run(
      () =>
        node.kind === 'type'
          ? createWholesaleCategory({
              parentSlug: node.row.slug,
              slug: fields.slug,
              name,
            })
          : createWholesaleCatalogue({
              categorySlug: node.row.slug,
              slug: fields.slug,
              name,
            }),
      `${noun[0].toUpperCase()}${noun.slice(1)} added`,
    )
    // Stay open on success so several can be added in a row — Jeans, Shirt,
    // Panjabi — and keep what was typed on a failure so it can be corrected.
    if (ok) fields.reset()
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-md border border-border p-4"
    >
      <h4 className="text-sm font-semibold">
        New {noun} in{' '}
        <span className="capitalize">{nodeName(node.row.name)}</span>
      </h4>
      <NameFieldsGrid
        id={id}
        fields={fields}
        autoFocus
        placeholders={
          node.kind === 'type'
            ? { en: 'Men', bn: 'পুরুষ', slug: 'men' }
            : { en: 'Jeans', bn: 'জিন্স', slug: 'jeans' }
        }
        slugHint={
          node.kind === 'type'
            ? 'Shared by every category on the store, so it must be unique — try “cloth-men” if “men” is taken. It cannot be changed later.'
            : 'Shared by every catalogue on the store, so it must be unique — try “men-jeans” if “jeans” is taken. It cannot be changed later.'
        }
      />
      <div className="flex gap-3">
        <Button type="submit" size="sm" disabled={!fields.complete}>
          Add {noun}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            fields.reset()
            setOpen(false)
          }}
        >
          <X className="size-4" aria-hidden />
          Close
        </Button>
      </div>
    </form>
  )
}

/* -------------------------------------------------------------------------- */
/* New trade line                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The create form for a top-level trade line — the one thing that has no parent
 * node to hang off, so it gets a page of its own (`/type/new`). On success it
 * opens the new line, ready for its first category.
 */
export function CreateTypeForm() {
  const id = useId()
  const { pending, run } = useNodeAction()
  const fields = useNameFields()
  const [scope, setScope] = useState<'wholesale' | 'both'>('wholesale')

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!fields.complete) return

    await run(
      () =>
        createWholesaleType({
          slug: fields.slug,
          name: { en: fields.en.trim(), bn: fields.bn.trim() },
          scope,
        }),
      'Trade line created',
      `${CATALOG_HOME}/type/${fields.slug}`,
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      className="min-w-0 space-y-5 rounded-lg border border-border bg-card p-6"
    >
      <LoadingOverlay show={pending} label="Saving…" />

      <div>
        <h2 className="text-lg font-semibold">New trade line</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The line of business a wholesaler trades in — Cloth, Electronics,
          Grocery. It is what they pick when they apply. Add its categories and
          catalogues after saving.
        </p>
      </div>

      <NameFieldsGrid
        id={id}
        fields={fields}
        autoFocus
        placeholders={{ en: 'Cloth', bn: 'কাপড়', slug: 'cloth' }}
        slugHint="Shared by every category on the store, so it must be unique. It cannot be changed later."
      />

      <div className="space-y-1.5">
        <Label htmlFor={`${id}-scope`}>Where it appears</Label>
        <select
          id={`${id}-scope`}
          value={scope}
          onChange={(e) => setScope(e.target.value as 'wholesale' | 'both')}
          className={SELECT_CLASS}
        >
          <option value="wholesale">Wholesale only</option>
          <option value="both">Shop + Wholesale</option>
        </select>
        <p className="text-xs text-muted-foreground">
          {scope === 'wholesale'
            ? 'A grouping for sellers, like Cloth. No shop aisle or page is built for it.'
            : 'Also usable as a shop aisle on the storefront.'}
        </p>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={!fields.complete}>
          Create trade line
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={CATALOG_HOME}>Cancel</Link>
        </Button>
      </div>
    </form>
  )
}
