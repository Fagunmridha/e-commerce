'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LoadingOverlay } from '@/components/loading-overlay'
import {
  upsertAttributeDefinition,
  deleteAttributeDefinition,
} from '@/app/actions/attributes'
import type { AttributeDefinition, AttributeType } from '@/lib/attribute-tree'
import type { Category, TreeStatus } from '@/lib/types'

const TYPE_LABEL: Record<AttributeType, string> = {
  text: 'Text',
  number: 'Number',
  select: 'Choice',
  boolean: 'Yes / No',
}

const TYPE_HINT: Record<AttributeType, string> = {
  text: 'A free line — Brand, Model, Fabric.',
  number: 'Digits only — Warranty months, Screen size.',
  select: 'One of a fixed list you write below — Size, Condition.',
  boolean: 'A tick — Imported, Rechargeable.',
}

/**
 * Define the fields a product has to fill in, per part of the catalogue tree.
 *
 * Grouped by scope and drawn as the same one-screen list the categories and
 * catalogues managers use — a field is five short inputs, and the whole point
 * is seeing which questions hang off which branch.
 *
 * The scope select offers trade lines and categories alike, because the two
 * mean different things and both are useful: a field on a line is asked of
 * every category under it, a field on a category only there.
 */
export function AttributesManager({
  definitions,
  categories,
}: {
  definitions: AttributeDefinition[]
  categories: Category[]
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  /** The definition id being edited, or '' for the create form. */
  const [editing, setEditing] = useState<string | null>(null)

  const label = useMemo(() => {
    const names = new Map(categories.map((c) => [c.slug, c.name.en]))
    return (slug: string) => names.get(slug) ?? slug
  }, [categories])

  const grouped = useMemo(() => {
    const scopes = [...new Set(definitions.map((d) => d.scopeSlug))]
    return scopes.map((scope) => ({
      scope,
      rows: definitions.filter((d) => d.scopeSlug === scope),
    }))
  }, [definitions])

  async function remove(row: AttributeDefinition) {
    if (
      !confirm(
        `Delete “${row.label.en}”? Every answer products have given to it goes too. Set it to Inactive instead to stop asking while keeping them.`,
      )
    ) {
      return
    }

    setPending(true)
    try {
      await deleteAttributeDefinition(row.id)
      toast.success('Field deleted')
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not delete that field',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <LoadingOverlay show={pending} label="Saving…" />

      {editing === '' ? (
        <DefinitionForm
          categories={categories}
          onDone={() => setEditing(null)}
          setPending={setPending}
        />
      ) : (
        <Button onClick={() => setEditing('')}>
          <Plus className="size-4" aria-hidden="true" />
          New field
        </Button>
      )}

      {grouped.length === 0 && editing !== '' && (
        <div className="rounded-lg border border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No product fields yet. Add one to a trade line — “Size” on Clothing,
            “Warranty” on Electronics — and every product filed under it will be
            asked for it.
          </p>
        </div>
      )}

      {grouped.map(({ scope, rows }) => (
        <Card key={scope}>
          <CardHeader>
            <CardTitle>{label(scope)}</CardTitle>
            <CardDescription>
              {rows.length} field{rows.length === 1 ? '' : 's'} · asked of every
              product filed here and under it
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {rows.map((row) =>
              editing === row.id ? (
                <DefinitionForm
                  key={row.id}
                  categories={categories}
                  existing={row}
                  onDone={() => setEditing(null)}
                  setPending={setPending}
                />
              ) : (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {row.label.en}
                      <span className="ml-2 text-muted-foreground">
                        {row.label.bn}
                      </span>
                      {row.status === 'inactive' && (
                        <span className="ml-2 rounded-sm bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
                          Inactive
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <code>{row.key}</code> · {TYPE_LABEL[row.type]} · position{' '}
                      {row.position}
                      {row.required && ' · required'}
                      {row.type === 'select' &&
                        ` · ${row.options.length} option${row.options.length === 1 ? '' : 's'}`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(row.id)}
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => remove(row)}>
                    <Trash2 className="size-4" aria-hidden="true" />
                    Delete
                  </Button>
                </div>
              ),
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function DefinitionForm({
  categories,
  existing,
  onDone,
  setPending,
}: {
  categories: Category[]
  existing?: AttributeDefinition
  onDone: () => void
  setPending: (value: boolean) => void
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    scopeSlug: existing?.scopeSlug ?? categories[0]?.slug ?? '',
    key: existing?.key ?? '',
    labelEn: existing?.label.en ?? '',
    labelBn: existing?.label.bn ?? '',
    type: existing?.type ?? ('text' as AttributeType),
    // One option per line is the shortest editor that handles both languages
    // without a nested list UI: "Small | ছোট", parsed on submit.
    options: (existing?.options ?? [])
      .map((option) => `${option.en} | ${option.bn}`)
      .join('\n'),
    required: existing?.required ?? false,
    position: (existing?.position ?? 0).toString(),
    status: existing?.status ?? ('active' as TreeStatus),
  })

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    try {
      await upsertAttributeDefinition({
        id: existing?.id ?? null,
        scopeSlug: form.scopeSlug,
        key: form.key,
        label: {
          en: form.labelEn.trim(),
          // Bangla falls back to English rather than saving blank, as
          // everywhere else in the console.
          bn: form.labelBn.trim() || form.labelEn.trim(),
        },
        type: form.type,
        options: form.options
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const [en, bn] = line.split('|').map((part) => part.trim())
            return { en, bn: bn || en }
          }),
        required: form.required,
        position: Number(form.position) || 0,
        status: form.status,
      })
      toast.success(existing ? 'Field saved' : 'Field created')
      onDone()
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not save that field',
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
          <Label htmlFor="attribute-scope">Applies to</Label>
          <select
            id="attribute-scope"
            value={form.scopeSlug}
            onChange={(e) => set('scopeSlug', e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.parentSlug ? '— ' : ''}
                {category.name.en}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            On a trade line it is asked of every category under it. On a
            category, only there.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="attribute-key">Key</Label>
          <Input
            id="attribute-key"
            value={form.key}
            onChange={(e) => set('key', e.target.value)}
            placeholder="e.g. fabric"
          />
          <p className="text-xs text-muted-foreground">
            The stable name answers are stored under. Unique within the scope.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="attribute-label-en">Label (English)</Label>
          <Input
            id="attribute-label-en"
            value={form.labelEn}
            onChange={(e) => set('labelEn', e.target.value)}
            placeholder="Fabric"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="attribute-label-bn">Label (Bangla)</Label>
          <Input
            id="attribute-label-bn"
            value={form.labelBn}
            onChange={(e) => set('labelBn', e.target.value)}
            placeholder="কাপড়"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="attribute-type">Type</Label>
          <select
            id="attribute-type"
            value={form.type}
            onChange={(e) => set('type', e.target.value as AttributeType)}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {(Object.keys(TYPE_LABEL) as AttributeType[]).map((type) => (
              <option key={type} value={type}>
                {TYPE_LABEL[type]}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">{TYPE_HINT[form.type]}</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="attribute-position">Position</Label>
          <Input
            id="attribute-position"
            type="number"
            min={0}
            value={form.position}
            onChange={(e) => set('position', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="attribute-status">Status</Label>
          <select
            id="attribute-status"
            value={form.status}
            onChange={(e) => set('status', e.target.value as TreeStatus)}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {form.type === 'select' && (
        <div className="space-y-1.5">
          <Label htmlFor="attribute-options">Options</Label>
          <textarea
            id="attribute-options"
            rows={4}
            value={form.options}
            onChange={(e) => set('options', e.target.value)}
            placeholder={'Small | ছোট\nMedium | মাঝারি\nLarge | বড়'}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <p className="text-xs text-muted-foreground">
            One per line, English first. Add “ | ” and the Bangla after it;
            without one the English is used for both.
          </p>
        </div>
      )}

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <Checkbox
          checked={form.required}
          onCheckedChange={(next) => set('required', next === true)}
        />
        <span>Required — a product cannot be saved without it</span>
      </label>

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
