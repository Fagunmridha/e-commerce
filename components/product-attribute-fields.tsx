'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import type { AttributeDefinition } from '@/lib/attribute-tree'
import type { Localized } from '@/lib/i18n'

/**
 * The admin-defined fields for whatever category a product form is currently
 * pointed at.
 *
 * One component shared by the admin form and the seller form, because the
 * fields are the same question asked of the same product — and because a second
 * copy is how the two would eventually disagree about what `boolean` means on
 * the way into a text column.
 *
 * Values are held by the caller as `Record<definitionId, string>`: the caller
 * already owns the rest of the form's state, and the definitions that apply
 * change as the category select changes, so this stays stateless.
 *
 * `pick` is passed in rather than `useLanguage()` called here — the admin
 * console is English-only and has no language provider above it.
 */
export function ProductAttributeFields({
  definitions,
  values,
  onChange,
  pick,
}: {
  definitions: AttributeDefinition[]
  values: Record<string, string>
  onChange: (definitionId: string, value: string) => void
  pick: (text: Localized) => string
}) {
  if (definitions.length === 0) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {definitions.map((definition) => {
        const id = `attribute-${definition.id}`
        const value = values[definition.id] ?? ''

        return (
          <div key={definition.id} className="space-y-1.5">
            <Label htmlFor={id}>
              {pick(definition.label)}
              {definition.required && (
                <span className="ml-1 text-destructive">*</span>
              )}
            </Label>

            {definition.type === 'select' ? (
              <select
                id={id}
                value={value}
                onChange={(event) => onChange(definition.id, event.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {/* A blank first option even when the field is required: the
                    form's own check catches an unanswered one, and
                    preselecting the first choice would record an answer
                    nobody gave. */}
                <option value="">—</option>
                {definition.options.map((option) => (
                  <option key={option.en} value={option.en}>
                    {pick(option)}
                  </option>
                ))}
              </select>
            ) : definition.type === 'boolean' ? (
              // Stored as the literal "true"; anything else — including the
              // absent row — reads as false, so unticking simply clears it.
              <label className="flex h-9 cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  id={id}
                  checked={value === 'true'}
                  onCheckedChange={(next) =>
                    onChange(definition.id, next === true ? 'true' : '')
                  }
                />
                <span className="text-muted-foreground">
                  {pick(definition.label)}
                </span>
              </label>
            ) : (
              <Input
                id={id}
                type={definition.type === 'number' ? 'number' : 'text'}
                value={value}
                onChange={(event) => onChange(definition.id, event.target.value)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
