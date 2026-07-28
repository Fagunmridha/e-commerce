'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { eq, inArray, ne } from 'drizzle-orm'
import { db } from '@/lib/db'
import { banners } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/auth'
import { deleteBlob } from '@/app/actions/media'
import { bannerSchema, type BannerInput } from '@/lib/validation/banners'
import { parseOrThrow } from '@/lib/validation/shared'

export type { BannerInput }

/** "Eid Sale — 25% Off!" → "eid-sale-25-off" */
function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100) || 'banner'
  )
}

/** Appends -2, -3… until the slug is free (ignoring the row being edited). */
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const taken = await db
    .select({ slug: banners.slug })
    .from(banners)
    .where(excludeId ? ne(banners.id, excludeId) : undefined)

  const used = new Set(taken.map((row) => row.slug))
  if (!used.has(base)) return base

  let suffix = 2
  while (used.has(`${base}-${suffix}`)) suffix += 1
  return `${base}-${suffix}`
}

function refresh() {
  updateTag('banners')
  revalidatePath('/')
  revalidatePath('/admin/banners')
}

export async function upsertBanner(input: BannerInput): Promise<void> {
  await requireAdmin()
  const data = parseOrThrow(bannerSchema, input)

  const existing = data.id
    ? (await db.select().from(banners).where(eq(banners.id, data.id)))[0]
    : undefined

  const slug =
    data.slug?.trim() ||
    existing?.slug ||
    (await uniqueSlug(slugify(data.title.en), data.id))

  const values = {
    slug,
    placement: data.placement,
    image: data.image,
    label: data.label,
    title: data.title,
    highlight: data.highlight,
    subtitle: data.subtitle,
    ctaLabel: data.ctaLabel,
    ctaHref: data.ctaHref,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    active: data.active,
    sortOrder: data.sortOrder,
    updatedAt: new Date(),
  }

  if (existing) {
    await db.update(banners).set(values).where(eq(banners.id, existing.id))

    // The replaced image is now unreferenced. Best-effort: an orphaned blob is
    // cheaper than a failed edit.
    if (existing.image !== data.image) {
      try {
        await deleteBlob(existing.image)
      } catch {
        // ignore
      }
    }
  } else {
    await db.insert(banners).values(values)
  }

  refresh()
}

export async function deleteBanner(id: string): Promise<void> {
  await requireAdmin()

  const [row] = await db.select().from(banners).where(eq(banners.id, id))
  if (!row) return

  await db.delete(banners).where(eq(banners.id, id))

  try {
    await deleteBlob(row.image)
  } catch {
    // ignore
  }

  refresh()
}

export async function setBannerActive(
  id: string,
  active: boolean,
): Promise<void> {
  await requireAdmin()
  await db
    .update(banners)
    .set({ active, updatedAt: new Date() })
    .where(eq(banners.id, id))
  refresh()
}

/** Bulk activate/deactivate from the table's selection. */
export async function setBannersActive(
  ids: string[],
  active: boolean,
): Promise<void> {
  await requireAdmin()
  if (ids.length === 0) return
  await db
    .update(banners)
    .set({ active, updatedAt: new Date() })
    .where(inArray(banners.id, ids))
  refresh()
}

/** Array order becomes `sortOrder`, so drag-to-reorder maps straight across. */
export async function reorderBanners(ids: string[]): Promise<void> {
  await requireAdmin()
  if (ids.length === 0) return

  const now = new Date()
  const updates = ids.map((id, index) =>
    db
      .update(banners)
      .set({ sortOrder: index, updatedAt: now })
      .where(eq(banners.id, id)),
  )

  // One transaction over Neon's HTTP protocol, so the list can never end up
  // half-renumbered. `batch` wants a non-empty tuple; the guard above proves it.
  type Update = (typeof updates)[number]
  await db.batch(updates as [Update, ...Update[]])

  refresh()
}

/** Moves a banner one slot up or down within its placement. */
export async function moveBanner(
  id: string,
  direction: 'up' | 'down',
): Promise<void> {
  await requireAdmin()

  const [row] = await db.select().from(banners).where(eq(banners.id, id))
  if (!row) return

  const siblings = await db
    .select()
    .from(banners)
    .where(eq(banners.placement, row.placement))

  const ordered = siblings.sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      a.createdAt.getTime() - b.createdAt.getTime(),
  )

  const index = ordered.findIndex((banner) => banner.id === id)
  const target = direction === 'up' ? index - 1 : index + 1
  if (index === -1 || target < 0 || target >= ordered.length) return

  const swapped = [...ordered]
  ;[swapped[index], swapped[target]] = [swapped[target], swapped[index]]

  await reorderBanners(swapped.map((banner) => banner.id))
}
