'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LoadingOverlay } from '@/components/loading-overlay'
import { ImageUploader } from '@/components/admin/image-uploader'
import { upsertCategory, deleteCategory } from '@/app/actions/categories'
import type { AdminCategory } from '@/lib/categories'
import type { CategoryScope } from '@/lib/types'

const SCOPE_HINT: Record<CategoryScope, string> = {
  both: 'Shown in the shop and offered to wholesale shops.',
  retail: 'Shop only — wholesalers cannot list under it.',
  wholesale: 'Trade only — no /slug page on the storefront.',
}

/**
 * Create, edit and delete categories, drawn as the tree they form: each trade
 * line as a card, with the categories filed under it inside.
 *
 * One screen rather than a list plus a form page, matching the catalogues
 * manager beside it — the whole point of a tree is seeing it as a tree, and
 * the counts on every row are what make a delete legible before it happens.
 */
export function CategoriesManager({
  categories,
}: {
  categories: AdminCategory[]
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  /** The slug being edited, or '' for the create form. Null means neither. */
  const [editing, setEditing] = useState<string | null>(null)

  const lines = useMemo(
    () => categories.filter((category) => category.parentSlug === null),
    [categories],
  )

  const grouped = useMemo(
    () =>
      lines.map((line) => ({
        line,
        children: categories.filter(
          (category) => category.parentSlug === line.slug,
        ),
      })),
    [lines, categories],
  )

  async function remove(row: AdminCategory) {
    // Say what the delete actually does before it happens. The two blocking
    // counts are already disabled in the UI, so anything reaching here only
    // has the recoverable side effects left to warn about.
    const effects = [
      row.catalogueCount &&
        `its ${row.catalogueCount} catalogue(s) go with it`,
      row.sellerCount &&
        `${row.sellerCount} wholesale shop(s) approved for it will have no trade line until you set a new one`,
    ].filter(Boolean)

    const warning = effects.length
      ? `Delete “${row.name.en}”? ${effects.join(', and ')}.`
      : `Delete “${row.name.en}”?`
    if (!confirm(warning)) return

    setPending(true)
    try {
      await deleteCategory(row.slug)
      toast.success('Category deleted')
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Could not delete that category',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <LoadingOverlay show={pending} label="Saving…" />

      {editing === '' ? (
        <CategoryForm
          categories={categories}
          onDone={() => setEditing(null)}
          setPending={setPending}
        />
      ) : (
        <Button onClick={() => setEditing('')}>
          <Plus className="size-4" aria-hidden="true" />
          New category
        </Button>
      )}

      {grouped.map(({ line, children }) => (
        <Card key={line.slug}>
          <CardHeader>
            <CardTitle>{line.name.en}</CardTitle>
            <CardDescription>
              {children.length
                ? `Trade line · ${children.length} categor${children.length === 1 ? 'y' : 'ies'} under it`
                : 'Products are filed directly under this one — add sub-categories to split it up.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {editing === line.slug ? (
              <CategoryForm
                categories={categories}
                existing={line}
                onDone={() => setEditing(null)}
                setPending={setPending}
              />
            ) : (
              <CategoryRow
                row={line}
                onEdit={() => setEditing(line.slug)}
                onDelete={() => remove(line)}
              />
            )}

            {children.map((child) =>
              editing === child.slug ? (
                <CategoryForm
                  key={child.slug}
                  categories={categories}
                  existing={child}
                  onDone={() => setEditing(null)}
                  setPending={setPending}
                />
              ) : (
                <div key={child.slug} className="pl-4">
                  <CategoryRow
                    row={child}
                    onEdit={() => setEditing(child.slug)}
                    onDelete={() => remove(child)}
                  />
                </div>
              ),
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function CategoryRow({
  row,
  onEdit,
  onDelete,
}: {
  row: AdminCategory
  onEdit: () => void
  onDelete: () => void
}) {
  // Both foreign keys are RESTRICT, so these two are knowable before the
  // click. Showing the reason beside a disabled button beats letting the
  // action fail and explaining it in a toast.
  const blocker = row.productCount
    ? `${row.productCount} product(s) here — move them first`
    : row.childCount
      ? `${row.childCount} sub-categor${row.childCount === 1 ? 'y' : 'ies'} — delete those first`
      : null

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {row.name.en}
          <span className="ml-2 text-muted-foreground">{row.name.bn}</span>
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          <code>{row.slug}</code> · {row.scope} · {row.productCount} product
          {row.productCount === 1 ? '' : 's'} · {row.catalogueCount} catalogue
          {row.catalogueCount === 1 ? '' : 's'} · {row.sellerCount} shop
          {row.sellerCount === 1 ? '' : 's'}
        </p>
        {blocker && (
          <p className="mt-0.5 text-xs text-muted-foreground">{blocker}</p>
        )}
      </div>
      <Button variant="outline" size="sm" onClick={onEdit}>
        <Pencil className="size-4" aria-hidden="true" />
        Edit
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={Boolean(blocker)}
        onClick={onDelete}
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Delete
      </Button>
    </div>
  )
}

function CategoryForm({
  categories,
  existing,
  onDone,
  setPending,
}: {
  categories: AdminCategory[]
  existing?: AdminCategory
  onDone: () => void
  setPending: (value: boolean) => void
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    slug: existing?.slug ?? '',
    nameEn: existing?.name.en ?? '',
    nameBn: existing?.name.bn ?? '',
    image: existing?.image ?? '',
    scope: existing?.scope ?? ('both' as CategoryScope),
    parentSlug: existing?.parentSlug ?? '',
  })

  const set = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => setForm((current) => ({ ...current, [key]: value }))

  // Only rows that are themselves lines, and never this row. The tree is two
  // levels deep, so anything already nested cannot take a child — offering it
  // here would only produce an error on save.
  const parentOptions = categories.filter(
    (category) =>
      category.parentSlug === null && category.slug !== existing?.slug,
  )

  // A row with children is a line by definition; moving it under another would
  // make three levels, which `upsertCategory` refuses.
  const parentLocked = Boolean(existing?.childCount)

  const leavingStorefront =
    form.scope === 'wholesale' &&
    existing &&
    existing.scope !== 'wholesale' &&
    existing.productCount > 0

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    try {
      await upsertCategory({
        slug: form.slug,
        // Bangla falls back to English rather than being saved blank — the
        // storefront reads whichever the viewer's locale asks for, and an
        // empty string there renders as a nameless tile.
        name: {
          en: form.nameEn.trim(),
          bn: form.nameBn.trim() || form.nameEn.trim(),
        },
        image: form.image,
        scope: form.scope,
        parentSlug: form.parentSlug || null,
      })
      toast.success(existing ? 'Category saved' : 'Category created')
      onDone()
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not save that category',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-md border border-border p-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category-slug">Slug</Label>
          <Input
            id="category-slug"
            value={form.slug}
            // The slug is the URL and the foreign key products point at.
            // Changing it on an existing row would orphan every one of them,
            // so an edit renames the label, never the identity.
            disabled={Boolean(existing)}
            onChange={(e) => set('slug', e.target.value)}
            placeholder="e.g. electronics"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category-parent">Trade line</Label>
          <select
            id="category-parent"
            value={form.parentSlug}
            disabled={parentLocked}
            onChange={(e) => set('parentSlug', e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
          >
            <option value="">— None (this is a trade line) —</option>
            {parentOptions.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name.en}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            {parentLocked
              ? `Has ${existing?.childCount} sub-categor${existing?.childCount === 1 ? 'y' : 'ies'}, so it stays a trade line.`
              : 'A trade line is what a wholesaler picks when they apply.'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category-name-en">Name (English)</Label>
          <Input
            id="category-name-en"
            value={form.nameEn}
            onChange={(e) => set('nameEn', e.target.value)}
            placeholder="Electronics"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category-name-bn">Name (Bangla)</Label>
          <Input
            id="category-name-bn"
            value={form.nameBn}
            onChange={(e) => set('nameBn', e.target.value)}
            placeholder="ইলেকট্রনিক্স"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category-scope">Where it appears</Label>
        <select
          id="category-scope"
          value={form.scope}
          onChange={(e) => set('scope', e.target.value as CategoryScope)}
          className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="both">Shop and trade</option>
          <option value="retail">Shop only</option>
          <option value="wholesale">Trade only</option>
        </select>
        <p className="text-xs text-muted-foreground">
          {SCOPE_HINT[form.scope]}
        </p>
        {leavingStorefront && (
          <p className="text-xs text-destructive">
            {existing?.productCount} product(s) filed here will disappear from
            the storefront, and /{form.slug} will stop resolving.
          </p>
        )}
      </div>

      <ImageUploader
        value={form.image}
        onChange={(url) => set('image', url)}
        folder="categories"
        label="Category image"
        hint="Shown on the homepage tile and the category banner."
      />

      <div className="flex gap-3">
        <Button type="submit" size="sm">
          {existing ? 'Save' : 'Create'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onDone}>
          <X className="size-4" aria-hidden="true" />
          Cancel
        </Button>
      </div>
    </form>
  )
}
