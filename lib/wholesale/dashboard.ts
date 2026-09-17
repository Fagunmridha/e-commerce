import 'server-only'
import { and, count, desc, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  catalogues,
  categories,
  orderItems,
  orders,
  products,
  wholesalerApplications,
  wholesalerTradeLines,
} from '@/lib/db/schema'
import type { Catalogue, Category, CategorySlug } from '@/lib/types'

/**
 * The wholesale dashboard's read layer.
 *
 * "Wholesale type" in the admin UI is a top-level category whose `scope` is
 * `wholesale` or `both` — the same rows `getWholesaleLines()` returns. A
 * "category" under a type is one of its children, and a "catalogue" is a row
 * in the `catalogues` table pointing back at that category. No new schema.
 *
 * Reads only — every mutation lives in `app/actions/wholesale-admin.ts`, where
 * `requireAdmin()` guards each call.
 */

export type WholesaleOverviewStats = {
  /** Approved seller applications — `status = 'approved'`. */
  totalSellers: number
  /** Pending seller applications — the queue an admin reviews. */
  pendingApplications: number
  /** Marketplace products only — `sellerId IS NOT NULL`. */
  wholesaleProducts: number
  /** Marketplace products awaiting an admin verdict — `approvalStatus = 'pending'`. */
  pendingProductApprovals: number
}

export async function getWholesaleOverviewStats(): Promise<WholesaleOverviewStats> {
  const [sellersRow] = await db
    .select({ n: count() })
    .from(wholesalerApplications)
    .where(eq(wholesalerApplications.status, 'approved'))

  const [pendingAppRow] = await db
    .select({ n: count() })
    .from(wholesalerApplications)
    .where(eq(wholesalerApplications.status, 'pending'))

  const [productsRow] = await db
    .select({ n: count() })
    .from(products)
    .where(isNotNull(products.sellerId))

  const [pendingProductRow] = await db
    .select({ n: count() })
    .from(products)
    .where(
      and(
        isNotNull(products.sellerId),
        eq(products.approvalStatus, 'pending'),
      ),
    )

  return {
    totalSellers: Number(sellersRow?.n ?? 0),
    pendingApplications: Number(pendingAppRow?.n ?? 0),
    wholesaleProducts: Number(productsRow?.n ?? 0),
    pendingProductApprovals: Number(pendingProductRow?.n ?? 0),
  }
}

export type RecentApplication = {
  id: string
  shopName: string
  contactName: string
  email: string
  phone: string
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  submitted: string
  /** Comma-joined English names of the trade lines this shop asked for. */
  tradeLines: string
}

/**
 * The five most recent applications — anything an admin might still need to act
 * on is in here, so the dashboard link goes straight to the review screen.
 */
export async function getRecentWholesaleApplications(
  limit = 5,
): Promise<RecentApplication[]> {
  const rows = await db
    .select({
      id: wholesalerApplications.id,
      shopName: wholesalerApplications.shopName,
      contactName: wholesalerApplications.contactName,
      email: wholesalerApplications.email,
      phone: wholesalerApplications.phone,
      status: wholesalerApplications.status,
      createdAt: wholesalerApplications.createdAt,
    })
    .from(wholesalerApplications)
    .orderBy(desc(wholesalerApplications.createdAt))
    .limit(limit)

  // Pull every requested line for these ids in one round trip rather than
  // N+1 — `wholesaler_trade_lines` is small.
  const ids = rows.map((row) => row.id)
  if (ids.length === 0) return []

  const lines = await db
    .select({
      applicationId: wholesalerTradeLines.applicationId,
      categoryName: categories.name,
    })
    .from(wholesalerTradeLines)
    .innerJoin(categories, eq(categories.slug, wholesalerTradeLines.categorySlug))
    .where(
      sql`${wholesalerTradeLines.applicationId} = ANY(${sql.raw(
        `ARRAY[${ids.map((id) => `'${id}'`).join(',')}]::uuid[]`,
      )})`,
    )

  const linesByApp = new Map<string, string[]>()
  for (const line of lines) {
    const list = linesByApp.get(line.applicationId) ?? []
    const english = (line.categoryName as { en?: string } | null)?.en ?? ''
    if (english) list.push(english)
    linesByApp.set(line.applicationId, list)
  }

  return rows.map((row) => ({
    id: row.id,
    shopName: row.shopName,
    contactName: row.contactName,
    email: row.email,
    phone: row.phone,
    status: row.status,
    submitted: row.createdAt.toISOString(),
    tradeLines: (linesByApp.get(row.id) ?? []).join(', '),
  }))
}

export type RecentPendingProduct = {
  id: string
  name: string
  shopName: string
  category: string
  price: number
  submittedAt: string | null
}

export async function getRecentWholesaleProductsForReview(
  limit = 5,
): Promise<RecentPendingProduct[]> {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      category: products.category,
      submittedAt: products.submittedAt,
      sellerId: products.sellerId,
    })
    .from(products)
    .where(
      and(
        isNotNull(products.sellerId),
        eq(products.approvalStatus, 'pending'),
      ),
    )
    .orderBy(desc(products.submittedAt))
    .limit(limit)

  // Pull the shop names separately — `wholesaler_applications.id` is uuid, the
  // `sellerId` we just selected matches.
  const sellerIds = Array.from(
    new Set(rows.map((row) => row.sellerId).filter(Boolean) as string[]),
  )
  const sellers =
    sellerIds.length === 0
      ? []
      : await db
          .select({
            id: wholesalerApplications.id,
            shopName: wholesalerApplications.shopName,
          })
          .from(wholesalerApplications)

  const shopNames = new Map(sellers.map((row) => [row.id, row.shopName]))

  return rows.map((row) => ({
    id: row.id,
    name: (row.name as { en?: string } | null)?.en ?? row.id,
    shopName: row.sellerId ? shopNames.get(row.sellerId) ?? 'Unknown' : '—',
    category: row.category,
    price: row.price,
    submittedAt: row.submittedAt?.toISOString() ?? null,
  }))
}

export type RecentWholesaleOrder = {
  id: string
  orderNumber: string
  customer: string
  total: number
  placedAt: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  itemCount: number
}

/**
 * The five most recent orders that contain at least one marketplace product.
 * Counts an order as "wholesale" if any of its lines has `seller_id` set — a
 * retail-only order is not what the wholesale dashboard wants to advertise.
 */
export async function getRecentWholesaleOrders(
  limit = 5,
): Promise<RecentWholesaleOrder[]> {
  // Find the orders first via a distinct on the order_items side, then load the
  // header rows by id. Avoids double-counting a multi-line order and keeps the
  // query under one join depth.
  const recent = await db
    .selectDistinct({
      orderId: orderItems.orderId,
    })
    .from(orderItems)
    .innerJoin(products, eq(products.id, orderItems.productId))
    .where(isNotNull(products.sellerId))
    .orderBy(desc(orderItems.orderId))
    .limit(limit * 2)

  if (recent.length === 0) return []

  const orderIds = recent.slice(0, limit).map((row) => row.orderId)
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customer: orders.name,
      total: orders.total,
      placedAt: orders.placedAt,
      status: orders.status,
      itemCount: orders.itemCount,
    })
    .from(orders)
    .where(sql`${orders.id} = ANY(${sql.raw(
      `ARRAY[${orderIds.map((id) => `'${id}'`).join(',')}]::uuid[]`,
    )})`)
    .orderBy(desc(orders.placedAt))

  return rows.map((row) => ({
    id: row.id,
    orderNumber: row.orderNumber,
    customer: row.customer,
    total: row.total,
    placedAt: row.placedAt.toISOString(),
    status: row.status,
    itemCount: row.itemCount,
  }))
}

export type WholesaleCatalogSummary = {
  /** Top-level, wholesale-scoped categories — what a seller picks when applying. */
  tradeLines: number
  /** Their children, where products are actually filed. */
  categories: number
  catalogues: number
}

/**
 * The three counts behind the "Manage the wholesale catalog" card — enough
 * for an admin to tell at a glance whether the tree has been filled in
 * without opening the manager.
 */
export async function getWholesaleCatalogSummary(): Promise<WholesaleCatalogSummary> {
  const tradeLineRows = await db
    .select({ slug: categories.slug })
    .from(categories)
    .where(and(isNull(categories.parentSlug), sql`${categories.scope} <> 'retail'`))

  if (tradeLineRows.length === 0) {
    return { tradeLines: 0, categories: 0, catalogues: 0 }
  }
  const tradeLineSlugs = tradeLineRows.map((row) => row.slug)

  const categoryRows = await db
    .select({ slug: categories.slug })
    .from(categories)
    .where(inArray(categories.parentSlug, tradeLineSlugs))

  const [catalogueRow] = categoryRows.length
    ? await db
        .select({ n: count() })
        .from(catalogues)
        .where(inArray(catalogues.categorySlug, categoryRows.map((row) => row.slug)))
    : [{ n: 0 }]

  return {
    tradeLines: tradeLineRows.length,
    categories: categoryRows.length,
    catalogues: Number(catalogueRow?.n ?? 0),
  }
}

/* -------------------------------------------------------------------------- */
/* Nested catalog manager tree                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The kind of node currently selected in the manager — a Type is a top-level
 * wholesale-scoped category, a Category sits under a Type, and a Catalogue is
 * the leaf.
 */
export type WholesaleNodeKind = 'type' | 'category' | 'catalogue'

export type WholesaleTreeType = Category & {
  children: WholesaleTreeCategory[]
}

export type WholesaleTreeCategory = Category & {
  catalogues: Catalogue[]
}

/**
 * The whole tree the manager renders on the left, ordered to match how the
 * existing categories page draws it: each line first, then its children, then
 * the catalogues under each child.
 */
export async function getWholesaleTree(): Promise<WholesaleTreeType[]> {
  // Wholesale + both scope, root rows only. The same query `getWholesaleLines`
  // runs, but cast through a count select so we can attach children later.
  const lines = await db
    .select()
    .from(categories)
    .where(
      and(
        isNull(categories.parentSlug),
        sql`${categories.scope} <> 'retail'`,
      ),
    )
    .orderBy(categories.position, categories.slug)

  if (lines.length === 0) return []

  const slugs = lines.map((line) => line.slug)
  const childRows = await db
    .select()
    .from(categories)
    .where(
      sql`${categories.parentSlug} = ANY(${sql.raw(
        `ARRAY[${slugs.map((s) => `'${s}'`).join(',')}]::text[]`,
      )})`,
    )
    .orderBy(categories.position, categories.slug)

  const cataloguesByCategory = new Map<string, Catalogue[]>()
  if (childRows.length > 0) {
    const childSlugs = childRows.map((row) => row.slug)
    const catalogueRows = await db
      .select()
      .from(catalogues)
      .where(
        sql`${catalogues.categorySlug} = ANY(${sql.raw(
          `ARRAY[${childSlugs.map((s) => `'${s}'`).join(',')}]::text[]`,
        )})`,
      )
      .orderBy(catalogues.categorySlug, catalogues.position, catalogues.slug)
    for (const row of catalogueRows) {
      const list = cataloguesByCategory.get(row.categorySlug) ?? []
      list.push({
        slug: row.slug,
        categorySlug: row.categorySlug,
        name: row.name,
        position: row.position,
        status: row.status,
      })
      cataloguesByCategory.set(row.categorySlug, list)
    }
  }

  return lines.map<WholesaleTreeType>((line) => ({
    slug: line.slug as CategorySlug,
    name: line.name,
    image: line.image,
    scope: line.scope,
    parentSlug: null,
    position: line.position,
    status: line.status,
    itemCount: 0,
    href: `/${line.slug}`,
    children: childRows
      .filter((child) => child.parentSlug === line.slug)
      .map<WholesaleTreeCategory>((child) => ({
        slug: child.slug as CategorySlug,
        name: child.name,
        image: child.image,
        scope: child.scope,
        parentSlug: child.parentSlug,
        position: child.position,
        status: child.status,
        itemCount: 0,
        href: `/${child.slug}`,
        catalogues: cataloguesByCategory.get(child.slug) ?? [],
      })),
  }))
}

export type WholesaleNodeDetail =
  | {
      kind: 'type'
      row: Category & {
        children: Category[]
        productCount: number
        sellerCount: number
      }
    }
  | {
      kind: 'category'
      row: Category & {
        catalogues: Catalogue[]
        productCount: number
      }
    }
  | {
      kind: 'catalogue'
      row: Catalogue & {
        parentCategoryName: string
        productCount: number
      }
    }

/**
 * Loads the row under `slug`, classifies it by where it sits in the wholesale
 * tree, and attaches the counts the right-hand panel shows.
 */
export async function getWholesaleNode(
  kind: WholesaleNodeKind,
  slug: string,
): Promise<WholesaleNodeDetail | null> {
  if (kind === 'catalogue') {
    const [row] = await db
      .select()
      .from(catalogues)
      .where(eq(catalogues.slug, slug))
    if (!row) return null

    const [parent] = await db
      .select({ name: categories.name })
      .from(categories)
      .where(eq(categories.slug, row.categorySlug))

    const [countRow] = await db
      .select({ n: count() })
      .from(products)
      .where(eq(products.catalogueSlug, slug))

    return {
      kind: 'catalogue',
      row: {
        slug: row.slug,
        categorySlug: row.categorySlug,
        name: row.name,
        position: row.position,
        status: row.status,
        parentCategoryName:
          (parent?.name as { en?: string } | null)?.en ?? row.categorySlug,
        productCount: Number(countRow?.n ?? 0),
      },
    }
  }

  const [row] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
  if (!row) return null

  if (kind === 'type') {
    const children = await db
      .select()
      .from(categories)
      .where(eq(categories.parentSlug, slug))
      .orderBy(categories.position, categories.slug)

    const [productRow] = await db
      .select({ n: count() })
      .from(products)
      .where(
        sql`${products.category} = ${slug} OR ${products.catalogueSlug} IN (${sql.raw(
          `SELECT slug FROM catalogues WHERE category_slug = '${slug}'`,
        )})`,
      )

    const [sellerRow] = await db
      .select({ n: count() })
      .from(wholesalerTradeLines)
      .where(eq(wholesalerTradeLines.categorySlug, slug))

    return {
      kind: 'type',
      row: {
        ...row,
        parentSlug: row.parentSlug ?? null,
        children,
        productCount: Number(productRow?.n ?? 0),
        sellerCount: Number(sellerRow?.n ?? 0),
      },
    }
  }

  // kind === 'category'
  const catRows = await db
    .select()
    .from(catalogues)
    .where(eq(catalogues.categorySlug, slug))
    .orderBy(catalogues.position, catalogues.slug)

  const [productRow] = await db
    .select({ n: count() })
    .from(products)
    .where(eq(products.category, slug))

  return {
    kind: 'category',
    row: {
      ...row,
      parentSlug: row.parentSlug ?? null,
      catalogues: catRows.map((row) => ({
        slug: row.slug,
        categorySlug: row.categorySlug,
        name: row.name,
        position: row.position,
        status: row.status,
      })),
      productCount: Number(productRow?.n ?? 0),
    },
  }
}
