'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { attributeDefinitions } from '@/lib/db/schema'
import { isUniqueViolation } from '@/lib/db/errors'
import { requireAdmin } from '@/lib/auth'
import {
  attributeDefinitionSchema,
  type AttributeDefinitionInput,
} from '@/lib/validation/admin'
import { parseOrThrow } from '@/lib/validation/shared'

export type { AttributeDefinitionInput }

/**
 * Admin management of the per-category product fields.
 *
 * Throws rather than returning a result object, matching the category and
 * catalogue actions beside it — the caller is the store owner in their own
 * console.
 */

function refresh() {
  // Definitions are read by both product forms and the detail page's spec
  // table, all of which sit behind the catalogue tag.
  updateTag('catalogue')
  revalidatePath('/admin/attributes')
  revalidatePath('/admin/products')
  revalidatePath('/wholesale/dashboard')
}

export async function upsertAttributeDefinition(
  input: AttributeDefinitionInput,
): Promise<void> {
  await requireAdmin()
  const data = parseOrThrow(attributeDefinitionSchema, input)

  const values = {
    scopeSlug: data.scopeSlug,
    key: data.key,
    label: data.label,
    type: data.type,
    // Only a choice field keeps its options. Saving them on a field that has
    // just been changed to `text` would leave a list nothing reads, ready to
    // reappear if the type were ever changed back.
    options: data.type === 'select' ? data.options : null,
    required: data.required,
    position: data.position,
    status: data.status,
    updatedAt: new Date(),
  }

  try {
    if (data.id) {
      // `scope_slug` and `key` are deliberately still writable on an edit:
      // unlike a category slug, nothing points at them by name — the answers
      // are keyed on this row's `id`, so renaming the field carries its own
      // history with it.
      await db
        .update(attributeDefinitions)
        .set(values)
        .where(eq(attributeDefinitions.id, data.id))
    } else {
      await db.insert(attributeDefinitions).values(values)
    }
  } catch (error) {
    if (isUniqueViolation(error, 'attribute_definitions_scope_key_idx')) {
      throw new Error(
        `A field with the key “${data.key}” already exists here — pick another key`,
      )
    }
    throw error
  }

  refresh()
}

/**
 * Deletes a definition, and with it every answer given to it — that foreign key
 * cascades. This is the destructive move; switching the field to `inactive`
 * stops it being asked for while keeping what products have already said.
 */
export async function deleteAttributeDefinition(id: string): Promise<void> {
  await requireAdmin()
  await db.delete(attributeDefinitions).where(eq(attributeDefinitions.id, id))
  refresh()
}
