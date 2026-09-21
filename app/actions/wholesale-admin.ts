'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { and, eq, isNotNull, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { categories, catalogues } from '@/lib/db/schema'
import { isUniqueViolation } from '@/lib/db/errors'
import { requireAdmin } from '@/lib/auth'
import { imageSchema, parseOrThrow } from '@/lib/validation/shared'
import { catalogueSchema } from '@/lib/validation/admin'
import { RESERVED_CATEGORY_SLUGS } from '@/lib/reserved-slugs'
import { z } from 'zod'
import type { Localized } from '@/lib/i18n'
import type { CategoryScope, TreeStatus } from '@/lib/types'

/**
 * Wholesale catalog mutations.
 *
 * Everything in `app/actions/categories.ts` and `app/actions/catalogues.ts`
 * already does what we need, but neither is scoped to the wholesale tree:
 * the category action would let an admin file a `retail`-only line into the
 * wholesale dashboard, and the catalogue action accepts any `categorySlug`
 * with no check that it sits under one. So these wrappers exist to scope the
 * call.
 *
 * Throw on error, matching the rest of the admin actions — the caller is the
 * store owner in their own console, where an error boundary is the right place
 * for "that did not work".
 */

function refresh() {
  updateTag('catalogue')
  revalidatePath('/admin/wholesale')
  revalidatePath('/admin/wholesale/catalog')
  // Wholesale manager reads can resolve to any depth in the tree.
  revalidatePath('/admin/wholesale/catalog/[kind]/[slug]', 'page')
  // Wholesale side: market, landing, dashboard.
  revalidatePath('/wholesale')
  revalidatePath('/wholesale/market')
  revalidatePath('/wholesale/dashboard')
  revalidatePath('/admin/categories')
  revalidatePath('/admin/catalogues')
  revalidatePath('/admin/products')
  // A `both` trade line is a shop aisle as well, and its photo is the tile on
  // the homepage. `updateTag` busts the data cache but not the prerendered
  // routes built from it — see `refresh` in categories.ts.
  revalidatePath('/', 'layout')
}

/**
 * Turns a unique-constraint failure on `categories` into a sentence naming what
 * to change. Anything else is rethrown as it came.
 */
function friendlyCategoryError(
  error: unknown,
  slug: string,
  what: 'trade line' | 'category',
): unknown {
  if (isUniqueViolation(error, 'categories_pkey')) {
    return new Error(
      `The slug “${slug}” is already used by another category on the store. Pick a different slug, or open it under Categories if it is the row you meant.`,
    )
  }
  if (isUniqueViolation(error, 'categories_parent_name_idx')) {
    return new Error(
      what === 'trade line'
        ? 'A trade line with that English name already exists'
        : 'A category with that English name already exists under this trade line',
    )
  }
  return error
}

/** The `catalogues` counterpart of `friendlyCategoryError`. */
function friendlyCatalogueError(error: unknown, slug: string): unknown {
  if (isUniqueViolation(error, 'catalogues_pkey')) {
    return new Error(
      `The slug “${slug}” is already used by another catalogue. Slugs are shared across the whole store — try a more specific one, like men-jeans.`,
    )
  }
  if (isUniqueViolation(error, 'catalogues_category_name_idx')) {
    return new Error(
      'A catalogue with that English name already exists in this category',
    )
  }
  return error
}

/**
 * A trade line's photo. Optional — the apply form and the market both fall back
 * to a plain tile when it is empty — so '' is a valid value, and is also how a
 * photo is removed.
 */
const wholesaleImageSchema = imageSchema
  .or(z.literal(''))
  .nullish()
  .transform((value) => value ?? '')

const wholesaleKindSchema = z.enum(['type', 'category', 'catalogue'])

const wholesaleSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'A slug is required')
  .max(64)
  .regex(/^[a-z0-9-]+$/, 'Use lower-case letters, numbers or hyphens')
  .refine(
    (value) => !RESERVED_CATEGORY_SLUGS.has(value),
    'That name is already a page on the store — pick another slug',
  )
  // `/admin/wholesale/catalog/type/new` is the create form; a row with this
  // slug could never be opened.
  .refine((value) => value !== 'new', '“new” is reserved — pick another slug')

const wholesaleRenameSchema = z.object({
  kind: wholesaleKindSchema,
  slug: wholesaleSlugSchema,
  name: z.object({
    en: z.string().trim().min(1, 'English text is required').max(500),
    bn: z.string().trim().min(1, 'Bangla text is required').max(500),
  }),
})

export type WholesaleRenameInput = z.infer<typeof wholesaleRenameSchema>

const wholesaleStatusSchema = z.object({
  kind: wholesaleKindSchema,
  slug: wholesaleSlugSchema,
})

export type WholesaleStatusInput = z.infer<typeof wholesaleStatusSchema>

const wholesaleCreateTypeSchema = z.object({
  slug: wholesaleSlugSchema,
  name: z.object({
    en: z.string().trim().min(1, 'English text is required').max(500),
    bn: z.string().trim().min(1, 'Bangla text is required').max(500),
  }),
  image: wholesaleImageSchema,
  /**
   * Wholesale catalog rows are open to trade but may also be browsable on the
   * storefront when scope is `both`. Defaulting to `wholesale` is the safe
   * narrow choice for the manager — an admin who wants it on `/shop` flips
   * the scope after creating it.
   */
  scope: z
    .enum(['wholesale', 'both'])
    .nullish()
    .transform((value) => value ?? 'wholesale'),
})

export type WholesaleCreateTypeInput = z.infer<typeof wholesaleCreateTypeSchema>

const wholesaleCreateCategorySchema = z.object({
  parentSlug: wholesaleSlugSchema,
  slug: wholesaleSlugSchema,
  name: z.object({
    en: z.string().trim().min(1, 'English text is required').max(500),
    bn: z.string().trim().min(1, 'Bangla text is required').max(500),
  }),
})

export type WholesaleCreateCategoryInput = z.infer<
  typeof wholesaleCreateCategorySchema
>

/**
 * Creates a brand-new wholesale trade line. The scope is locked to
 * `wholesale` or `both` because nothing else belongs on the wholesale manager
 * — a `retail`-only line would not appear under the wholesale tree, and a
 * form that lets an admin pick it is the kind of bug that does not show up
 * until somebody filters a report and finds the row missing.
 *
 * A plain insert, not an upsert: `slug` is the primary key of every category
 * on the store, so reusing one would silently rename a live row — an aisle the
 * shop already sells from — while the form reported success.
 */
export async function createWholesaleType(
  input: WholesaleCreateTypeInput,
): Promise<void> {
  await requireAdmin()
  const data = parseOrThrow(wholesaleCreateTypeSchema, input)

  try {
    await db.insert(categories).values({
      slug: data.slug,
      name: data.name,
      image: data.image,
      scope: data.scope satisfies CategoryScope,
      parentSlug: null,
      position: 0,
      status: 'active' satisfies TreeStatus,
    })
  } catch (error) {
    throw friendlyCategoryError(error, data.slug, 'trade line')
  }

  refresh()
}

/**
 * Creates a category filed under an existing wholesale trade line. The parent
 * is checked to be a root wholesale row — a category filed under a *category*
 * would silently build the third tree level the admin form was meant to stop.
 */
export async function createWholesaleCategory(
  input: WholesaleCreateCategoryInput,
): Promise<void> {
  await requireAdmin()
  const data = parseOrThrow(wholesaleCreateCategorySchema, input)

  const [parent] = await db
    .select({ slug: categories.slug, parentSlug: categories.parentSlug })
    .from(categories)
    .where(
      and(
        eq(categories.slug, data.parentSlug),
        isNull(categories.parentSlug),
      ),
    )
  if (!parent) {
    throw new Error('The parent must be a wholesale trade line')
  }

  try {
    await db.insert(categories).values({
      slug: data.slug,
      name: data.name,
      image: '',
      scope: 'wholesale',
      parentSlug: data.parentSlug,
      position: 0,
      status: 'active',
    })
  } catch (error) {
    throw friendlyCategoryError(error, data.slug, 'category')
  }

  refresh()
}

const wholesaleNodeImageSchema = z.object({
  /** Only the two kinds that are `categories` rows — a catalogue has no photo. */
  kind: z.enum(['type', 'category']),
  slug: wholesaleSlugSchema,
  image: wholesaleImageSchema,
})

export type WholesaleNodeImageInput = z.input<typeof wholesaleNodeImageSchema>

/**
 * Sets, replaces or (with '') removes the photo of a trade line or a category.
 *
 * `kind` is checked against where the row sits, so a request cannot write the
 * photo of a category through the trade-line path or the reverse. The replaced
 * file is left in the bucket, as it is by `upsertCategory`: the same URL may
 * still be pasted on another row.
 */
export async function setWholesaleNodeImage(
  input: WholesaleNodeImageInput,
): Promise<void> {
  await requireAdmin()
  const data = parseOrThrow(wholesaleNodeImageSchema, input)

  const [updated] = await db
    .update(categories)
    .set({ image: data.image, updatedAt: new Date() })
    .where(
      and(
        eq(categories.slug, data.slug),
        data.kind === 'type'
          ? isNull(categories.parentSlug)
          : isNotNull(categories.parentSlug),
      ),
    )
    .returning({ slug: categories.slug })
  if (!updated) {
    throw new Error(
      data.kind === 'type'
        ? 'That trade line does not exist'
        : 'That category does not exist',
    )
  }

  refresh()
}

/**
 * Renames any node — Type, Category, or Catalogue. The kind decides which
 * table to write to and which breadcrumb to invalidate. Catalogue names do
 * not appear in the dashboard counts, but invalidating the path is cheaper
 * than thinking about whether a given call site is sensitive.
 */
export async function renameWholesaleNode(
  input: WholesaleRenameInput,
): Promise<void> {
  await requireAdmin()
  const data = parseOrThrow(wholesaleRenameSchema, input)

  if (data.kind === 'catalogue') {
    const [updated] = await db
      .update(catalogues)
      .set({ name: data.name, updatedAt: new Date() })
      .where(eq(catalogues.slug, data.slug))
      .returning({ slug: catalogues.slug })
      .catch((error) => {
        throw friendlyCatalogueError(error, data.slug)
      })
    if (!updated) throw new Error('That catalogue does not exist')
  } else {
    const [updated] = await db
      .update(categories)
      .set({ name: data.name, updatedAt: new Date() })
      .where(eq(categories.slug, data.slug))
      .returning({ slug: categories.slug })
      .catch((error) => {
        throw friendlyCategoryError(error, data.slug, 'category')
      })
    if (!updated) throw new Error('That node does not exist')
  }

  refresh()
}

/**
 * Toggles `active`/`inactive` on any node.
 *
 * Inactive nodes disappear from every picker and filter, but products already
 * filed underneath keep their `category`/`catalogue_slug` — see
 * `getActiveCatalogues` for the matching read side.
 */
export async function toggleWholesaleNodeStatus(
  input: WholesaleStatusInput,
): Promise<void> {
  await requireAdmin()
  const data = parseOrThrow(wholesaleStatusSchema, input)

  if (data.kind === 'catalogue') {
    const [row] = await db
      .select({ status: catalogues.status })
      .from(catalogues)
      .where(eq(catalogues.slug, data.slug))
    if (!row) throw new Error('That catalogue does not exist')

    await db
      .update(catalogues)
      .set({
        status: row.status === 'active' ? 'inactive' : 'active',
        updatedAt: new Date(),
      })
      .where(eq(catalogues.slug, data.slug))
  } else {
    const [row] = await db
      .select({ status: categories.status })
      .from(categories)
      .where(eq(categories.slug, data.slug))
    if (!row) throw new Error('That node does not exist')

    await db
      .update(categories)
      .set({
        status: row.status === 'active' ? 'inactive' : 'active',
        updatedAt: new Date(),
      })
      .where(eq(categories.slug, data.slug))
  }

  refresh()
}

const wholesaleCreateCatalogueSchema = z.object({
  /** Always a Category, never a Type — catalogues are filed under categories. */
  categorySlug: wholesaleSlugSchema,
  slug: wholesaleSlugSchema,
  name: z.object({
    en: z.string().trim().min(1, 'English text is required').max(500),
    bn: z.string().trim().min(1, 'Bangla text is required').max(500),
  }),
})

export type WholesaleCreateCatalogueInput = z.infer<
  typeof wholesaleCreateCatalogueSchema
>

/**
 * Creates a catalogue under an existing wholesale category. The parent must
 * already be a Category row under a wholesale Type — `getWholesaleNode`
 * already enforces that, but we re-check at write time so a stale client
 * cannot land a catalogue under the wrong row.
 */
export async function createWholesaleCatalogue(
  input: WholesaleCreateCatalogueInput,
): Promise<void> {
  await requireAdmin()
  const data = parseOrThrow(wholesaleCreateCatalogueSchema, input)

  const [parent] = await db
    .select({ slug: categories.slug, parentSlug: categories.parentSlug })
    .from(categories)
    .where(eq(categories.slug, data.categorySlug))
  if (!parent) {
    throw new Error('The parent category does not exist')
  }
  if (!parent.parentSlug) {
    throw new Error(
      'Catalogues live one level down — pick a category under a trade line, not a trade line itself',
    )
  }

  // Reuse the catalogue schema's normalisation — `.toLowerCase()` and the
  // slug regex — but drop the `categorySlug` so it can be substituted with
  // the wholesale-scoped one.
  const values = parseOrThrow(catalogueSchema.omit({ categorySlug: true }), {
    slug: data.slug,
    name: data.name,
    position: 0,
    status: 'active',
    categorySlug: data.categorySlug,
  })

  try {
    await db.insert(catalogues).values({
      slug: values.slug,
      categorySlug: data.categorySlug,
      name: values.name,
      position: values.position,
      status: values.status,
    })
  } catch (error) {
    throw friendlyCatalogueError(error, values.slug)
  }

  refresh()
}
