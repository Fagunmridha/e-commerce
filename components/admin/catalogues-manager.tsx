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
import { upsertCatalogue, deleteCatalogue } from '@/app/actions/catalogues'
import type { Catalogue, Category } from '@/lib/types'

type Row = Catalogue & { productCount: number }

/**
 * Create, rename, reorder and delete catalogues, grouped under their category.
 *
 * One screen rather than a list plus a separate form page: a catalogue is four
 * short fields, and the whole point of the tree is seeing it as a tree.
 */
export function CataloguesManager({
  catalogues,
  categories,
}: {
  catalogues: Row[]
  categories: Category[]
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  /** The slug being edited, or '' for the create form. Null means neither. */
  const [editing, setEditing] = useState<string | null>(null)

  const grouped = useMemo(() => {
    return categories.map((category) => ({
      category,
      rows: catalogues.filter((row) => row.categorySlug === category.slug),
    }))
  }, [categories, catalogues])

  async function remove(row: Row) {
    // Deleting a catalogue leaves its products alone — they fall back to "All"
    // — but the admin should know how many are about to move before it happens.
    const warning = row.productCount
      ? `Delete “${row.name.en}”? Its ${row.productCount} product(s) stay in the shop and move back under “All”.`
      : `Delete “${row.name.en}”?`
    if (!confirm(warning)) return

    setPending(true)
    try {
      await deleteCatalogue(row.slug)
      toast.success('Catalogue deleted')
      router.refresh()
    } catch {
      toast.error('Could not delete that catalogue')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <LoadingOverlay show={pending} label="Saving…" />

      {editing === '' ? (
        <CatalogueForm
          categories={categories}
          onDone={() => setEditing(null)}
          setPending={setPending}
        />
      ) : (
        <Button onClick={() => setEditing('')}>
          <Plus className="size-4" aria-hidden="true" />
          New catalogue
        </Button>
      )}

      {grouped.map(({ category, rows }) => (
        <Card key={category.slug}>
          <CardHeader>
            <CardTitle className="capitalize">{category.name.en}</CardTitle>
            <CardDescription>
              {rows.length
                ? `${rows.length} catalogue${rows.length === 1 ? '' : 's'}`
                : 'No catalogues yet — products here show under “All”.'}
            </CardDescription>
          </CardHeader>
          {rows.length > 0 && (
            <CardContent className="space-y-2">
              {rows.map((row) =>
                editing === row.slug ? (
                  <CatalogueForm
                    key={row.slug}
                    categories={categories}
                    existing={row}
                    onDone={() => setEditing(null)}
                    setPending={setPending}
                  />
                ) : (
                  <div
                    key={row.slug}
                    className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {row.name.en}
                        <span className="ml-2 text-muted-foreground">
                          {row.name.bn}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <code>{row.slug}</code> · position {row.position} ·{' '}
                        {row.productCount} product
                        {row.productCount === 1 ? '' : 's'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(row.slug)}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => remove(row)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Delete
                    </Button>
                  </div>
                ),
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )
}

function CatalogueForm({
  categories,
  existing,
  onDone,
  setPending,
}: {
  categories: Category[]
  existing?: Row
  onDone: () => void
  setPending: (value: boolean) => void
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    slug: existing?.slug ?? '',
    categorySlug: existing?.categorySlug ?? categories[0]?.slug ?? '',
    nameEn: existing?.name.en ?? '',
    nameBn: existing?.name.bn ?? '',
    position: (existing?.position ?? 0).toString(),
  })

  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }))

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    try {
      await upsertCatalogue({
        slug: form.slug,
        categorySlug: form.categorySlug,
        // Bangla falls back to English rather than being saved blank — the
        // storefront reads whichever the viewer's locale asks for, and an
        // empty string there renders as a nameless option.
        name: { en: form.nameEn.trim(), bn: form.nameBn.trim() || form.nameEn.trim() },
        position: Number(form.position) || 0,
      })
      toast.success(existing ? 'Catalogue saved' : 'Catalogue created')
      onDone()
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not save that catalogue',
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
          <Label htmlFor="catalogue-slug">Slug</Label>
          <Input
            id="catalogue-slug"
            value={form.slug}
            // The slug is the URL and the foreign key products point at.
            // Changing it on an existing row would orphan every one of them,
            // so an edit renames the label, never the identity.
            disabled={Boolean(existing)}
            onChange={(e) => set('slug', e.target.value)}
            placeholder="e.g. jeans"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="catalogue-category">Category</Label>
          <select
            id="catalogue-category"
            value={form.categorySlug}
            onChange={(e) => set('categorySlug', e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm capitalize outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name.en}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="catalogue-name-en">Name (English)</Label>
          <Input
            id="catalogue-name-en"
            value={form.nameEn}
            onChange={(e) => set('nameEn', e.target.value)}
            placeholder="Jeans"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="catalogue-name-bn">Name (Bangla)</Label>
          <Input
            id="catalogue-name-bn"
            value={form.nameBn}
            onChange={(e) => set('nameBn', e.target.value)}
            placeholder="জিন্স"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="catalogue-position">Position</Label>
          <Input
            id="catalogue-position"
            type="number"
            min={0}
            value={form.position}
            onChange={(e) => set('position', e.target.value)}
          />
        </div>
      </div>

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
