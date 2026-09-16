import 'server-only'
import { unstable_cache } from 'next/cache'
import { asc, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { attributeDefinitions, productAttributeValues } from '@/lib/db/schema'
import type { AttributeDefinition, AttributeValue } from '@/lib/attribute-tree'

/**
 * Reading and writing the admin-defined product fields.
 *
 * The *shape* of the tree — the types and the inheritance rule — lives in
 * `lib/attribute-tree.ts`, which has no database import, because both product
 * forms are client components that need it. Re-exported here so a server caller
 * has one module to reach for.
 */
export * from '@/lib/attribute-tree'

function toDefinition(
  row: typeof attributeDefinitions.$inferSelect,
): AttributeDefinition {
  return {
    id: row.id,
    scopeSlug: row.scopeSlug,
    key: row.key,
    label: row.label,
    // Normalised to an array here so nothing downstream has to think about the
    // null a non-select definition carries.
    options: row.options ?? [],
    type: row.type,
    required: row.required,
    position: row.position,
    status: row.status,
  }
}

/**
 * Every definition in the store, ordered the way the forms draw them. The admin
 * screen shows the lot — including `inactive` ones, which are its to switch
 * back on — so this is deliberately unfiltered, like `getAllCategories`.
 */
export async function getAllAttributeDefinitions(): Promise<
  AttributeDefinition[]
> {
  const rows = await db
    .select()
    .from(attributeDefinitions)
    .orderBy(
      asc(attributeDefinitions.scopeSlug),
      asc(attributeDefinitions.position),
      asc(attributeDefinitions.key),
    )

  return rows.map(toDefinition)
}

/**
 * The same list, cached on the `catalogue` tag. For pages every shopper loads —
 * the market reads it on each visit, and the DB is a round trip across an
 * ocean. `upsertAttributeDefinition` busts the tag, so an admin's new field
 * shows at once. The admin screen keeps reading the uncached version above.
 */
export const getCachedAttributeDefinitions = unstable_cache(
  getAllAttributeDefinitions,
  ['attribute-definitions'],
  { tags: ['catalogue'], revalidate: 60 },
)

/** One product's stored answers. */
export async function getProductAttributes(
  productId: string,
): Promise<AttributeValue[]> {
  const rows = await db
    .select({
      definitionId: productAttributeValues.definitionId,
      value: productAttributeValues.value,
    })
    .from(productAttributeValues)
    .where(eq(productAttributeValues.productId, productId))

  return rows
}

/**
 * Replaces a product's answers with exactly `values`.
 *
 * Delete-then-insert rather than a diff, for the same reason the trade lines
 * are written that way: a form submission is a complete answer, and a field
 * cleared on the form has to disappear rather than linger as whatever it said
 * last time. Blank values are dropped instead of stored — "" is not an answer,
 * and keeping it would make a spec table print empty rows.
 *
 * Returned as batch items rather than executed, so the caller can send them
 * with the product write in one round trip. Neon's HTTP driver has no
 * interactive transaction; a batch is the nearest thing, and it keeps the specs
 * from landing without the product they describe.
 */
export function attributeWrites(
  productId: string,
  values: AttributeValue[],
  allowed: AttributeDefinition[],
) {
  const known = new Set(allowed.map((definition) => definition.id))
  const rows = values
    .filter((entry) => known.has(entry.definitionId) && entry.value.trim())
    .map((entry) => ({
      productId,
      definitionId: entry.definitionId,
      value: entry.value.trim(),
    }))

  const clear = db
    .delete(productAttributeValues)
    .where(eq(productAttributeValues.productId, productId))

  return rows.length > 0
    ? ([clear, db.insert(productAttributeValues).values(rows)] as const)
    : ([clear] as const)
}

/** Answers for several products at once — the spec column on a list. */
export async function getAttributesForProducts(
  productIds: string[],
): Promise<Map<string, AttributeValue[]>> {
  if (productIds.length === 0) return new Map()

  const rows = await db
    .select()
    .from(productAttributeValues)
    .where(inArray(productAttributeValues.productId, productIds))

  const found = new Map<string, AttributeValue[]>()
  for (const row of rows) {
    const list = found.get(row.productId) ?? []
    list.push({ definitionId: row.definitionId, value: row.value })
    found.set(row.productId, list)
  }
  return found
}
