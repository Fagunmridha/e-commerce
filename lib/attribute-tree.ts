import type { Localized } from '@/lib/i18n'
import type { Category, CategorySlug, TreeStatus } from '@/lib/types'

/**
 * The shape of the product-field tree, and the one rule for reading it.
 *
 * Deliberately free of any database import, exactly like `category-tree.ts`:
 * both product forms are client components that have to know which fields
 * apply, and the server action that saves them has to check the same thing. One
 * module, imported by both, so neither can drift.
 */

export type AttributeType = 'text' | 'number' | 'select' | 'boolean'

export type AttributeDefinition = {
  id: string
  scopeSlug: CategorySlug
  key: string
  label: Localized
  type: AttributeType
  options: Localized[]
  required: boolean
  position: number
  status: TreeStatus
}

/** One product's answers, as the forms and the spec table read them. */
export type AttributeValue = { definitionId: string; value: string }

/**
 * The attributes a product filed under `categorySlug` must answer.
 *
 * This is the inheritance rule: a definition counts when its scope is the
 * category itself *or* the trade line above it, so "Brand" declared once on
 * Electronics is asked of Mobile, Laptop and TV alike. A line's own definitions
 * come first, because they are the general questions and the category's are the
 * specific ones.
 *
 * `inactive` definitions are dropped. Answers already given to them survive in
 * `product_attribute_values` — switching one back on brings them with it, which
 * is the difference between deactivating and deleting.
 *
 * Pure over lists the caller already has: every caller is a page or a form that
 * loaded the categories anyway, and a query here would be a round trip for a
 * join the process can do in memory.
 */
export function definitionsForCategory(
  definitions: AttributeDefinition[],
  categories: Category[],
  categorySlug: CategorySlug,
): AttributeDefinition[] {
  const category = categories.find((entry) => entry.slug === categorySlug)
  if (!category) return []

  const scopes = [category.parentSlug, category.slug].filter(
    (slug): slug is CategorySlug => Boolean(slug),
  )

  return scopes.flatMap((scope) =>
    definitions.filter(
      (definition) =>
        definition.scopeSlug === scope && definition.status === 'active',
    ),
  )
}

/** The answers a form starts with, keyed the way its fields read them. */
export function toValueMap(values: AttributeValue[]): Record<string, string> {
  return Object.fromEntries(
    values.map((entry) => [entry.definitionId, entry.value]),
  )
}

/**
 * The first required field left blank, or null. Returned as the definition
 * rather than a boolean so the caller can name it in the error it shows.
 */
export function firstMissing(
  definitions: AttributeDefinition[],
  values: Record<string, string>,
): AttributeDefinition | null {
  return (
    definitions.find(
      (definition) => definition.required && !values[definition.id]?.trim(),
    ) ?? null
  )
}
