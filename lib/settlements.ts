import 'server-only'
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  gte,
  ilike,
  lte,
  ne,
  or,
  sql,
} from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  orderItems,
  orders,
  settlements,
  wholesalerApplications,
  type SettlementRow,
} from '@/lib/db/schema'
import type { SettlementStatus } from '@/lib/admin/settlement-status'
import type { SettlementLine } from '@/lib/settlement-view'

/**
 * Reading what the store owes its sellers.
 *
 * Every row here is written by `createOrder` and moved by `updateOrderStatus`;
 * nothing in this module creates one. The only write is `markSettlementPaid`,
 * which is a human recording a payment that happened outside the app.
 */

/** A settlement plus the order it came out of — one row of any list. */
export type SettlementListRow = SettlementRow & {
  orderNumber: string
  orderStatus: string
  orderDiscount: number
  placedAt: Date
}

/**
 * Re-exported from `lib/settlement-view.ts`, where it is defined. That module
 * is not `server-only`, because the seller's sheet is a client component and
 * has to name this shape without pulling the database in behind it.
 */
export type { SettlementLine }

export type SettlementDetail = SettlementListRow & { lines: SettlementLine[] }

/**
 * Every settlement column plus the handful of order columns a list row needs.
 * Declared once because all six queries below select exactly this shape, and
 * `SettlementListRow` is only true as long as they keep agreeing.
 *
 * `orderStatus` and `orderDiscount` ride along for the reconcile view and the
 * store-net warning respectively — both are the store's own business, and
 * neither is ever shown on a seller's copy of anything.
 */
const listColumns = {
  ...getTableColumns(settlements),
  orderNumber: orders.orderNumber,
  orderStatus: orders.status,
  orderDiscount: orders.discount,
  placedAt: orders.placedAt,
}

export type SettlementQuery = {
  status?: SettlementStatus
  sellerId?: string
  /** Matches the settlement number or the order number. */
  search?: string
  /** `YYYY-MM-DD`, inclusive, against `settled_at`. */
  from?: string
  to?: string
  /** Only rows where money went out on an order that is no longer delivered. */
  reconcile?: boolean
}

/**
 * `to` is an exclusive bound one day later, so a range that ends on the 14th
 * still includes a settlement stamped at 14:32 on the 14th. Comparing a
 * `timestamp` against the bare date would silently drop that whole day.
 */
function endOfDay(date: string): Date {
  const next = new Date(`${date}T00:00:00.000Z`)
  next.setUTCDate(next.getUTCDate() + 1)
  return next
}

function buildWhere(query: SettlementQuery) {
  const clauses = []

  if (query.status) clauses.push(eq(settlements.status, query.status))
  if (query.sellerId) clauses.push(eq(settlements.sellerId, query.sellerId))
  if (query.from) {
    clauses.push(gte(settlements.settledAt, new Date(`${query.from}T00:00:00.000Z`)))
  }
  if (query.to) clauses.push(lte(settlements.settledAt, endOfDay(query.to)))

  if (query.search) {
    const term = `%${query.search.trim()}%`
    clauses.push(
      or(
        ilike(settlements.settlementNumber, term),
        ilike(orders.orderNumber, term),
        ilike(settlements.shopNameSnapshot, term),
      ),
    )
  }

  // Money that has left the building on an order that is not delivered any
  // more. Never auto-reversed — see `settlementTransition` in lib/orders.ts —
  // so it has to be findable, or a cancelled-after-paying order is silently
  // wrong for ever.
  if (query.reconcile) {
    clauses.push(eq(settlements.status, 'paid'))
    clauses.push(ne(orders.status, 'delivered'))
  }

  return clauses.length ? and(...clauses) : undefined
}

/** The admin list. Newest delivery first; undelivered rows fall to the bottom. */
export async function getSettlementsPage(
  query: SettlementQuery = {},
  limit = 500,
): Promise<SettlementListRow[]> {
  return db
    .select(listColumns)
    .from(settlements)
    .innerJoin(orders, eq(orders.id, settlements.orderId))
    .where(buildWhere(query))
    .orderBy(desc(settlements.settledAt), desc(settlements.createdAt))
    .limit(limit)
}

/** Counts for the status pills, in one round trip rather than four. */
export async function getSettlementStatusCounts(): Promise<
  Record<SettlementStatus | 'all', number>
> {
  const rows = await db
    .select({ status: settlements.status, n: count() })
    .from(settlements)
    .groupBy(settlements.status)

  const counts = { all: 0, pending: 0, due: 0, paid: 0, void: 0 }
  for (const row of rows) {
    counts[row.status] = Number(row.n)
    counts.all += Number(row.n)
  }
  return counts
}

/** How many paid settlements sit on an order that is no longer delivered. */
export async function getReconcileCount(): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(settlements)
    .innerJoin(orders, eq(orders.id, settlements.orderId))
    .where(and(eq(settlements.status, 'paid'), ne(orders.status, 'delivered')))

  return Number(row?.n ?? 0)
}

/** What the store owes each shop right now — the admin's payables summary. */
export async function getPayablesBySeller(): Promise<
  { sellerId: string | null; shopName: string; due: number; count: number }[]
> {
  const rows = await db
    .select({
      sellerId: settlements.sellerId,
      shopName: settlements.shopNameSnapshot,
      due: sql<number>`sum(${settlements.payoutAmount})`,
      n: count(),
    })
    .from(settlements)
    .where(eq(settlements.status, 'due'))
    .groupBy(settlements.sellerId, settlements.shopNameSnapshot)
    .orderBy(desc(sql`sum(${settlements.payoutAmount})`))

  return rows.map((row) => ({
    sellerId: row.sellerId,
    shopName: row.shopName,
    due: Number(row.due),
    count: Number(row.n),
  }))
}

/**
 * The lines behind a settlement.
 *
 * Scoped by `(order_id, seller_id)` — the same pair the unique index is on — so
 * a shop's sheet can only ever itemise its own goods, even when another shop's
 * lines sit in the same order. This is what keeps the document anonymous: the
 * order total is never computed, because it would reveal how much of the basket
 * belonged to someone else.
 */
async function loadLines(
  orderId: string,
  sellerId: string | null,
): Promise<SettlementLine[]> {
  if (!sellerId) return []

  return db
    .select({
      name: orderItems.nameSnapshot,
      image: orderItems.imageSnapshot,
      quantity: orderItems.quantity,
      size: orderItems.size,
      colorEn: orderItems.colorEn,
      unitPrice: orderItems.unitPrice,
      commissionPct: orderItems.commissionPct,
    })
    .from(orderItems)
    .where(
      and(eq(orderItems.orderId, orderId), eq(orderItems.sellerId, sellerId)),
    )
}

/** One settlement for the admin console — no ownership scope, by design. */
export async function getSettlementById(
  id: string,
): Promise<SettlementDetail | null> {
  const [row] = await db
    .select(listColumns)
    .from(settlements)
    .innerJoin(orders, eq(orders.id, settlements.orderId))
    .where(eq(settlements.id, id))

  if (!row) return null
  return { ...row, lines: await loadLines(row.orderId, row.sellerId) }
}

/**
 * One settlement as its *seller* sees it.
 *
 * The shop id is in the WHERE clause rather than checked afterwards: a server
 * component is reachable by URL, so "this settlement is mine" has to be part of
 * the query, not something the dashboard is trusted to have established.
 */
export async function getSellerSettlement(
  shopId: string,
  id: string,
): Promise<SettlementDetail | null> {
  const [row] = await db
    .select(listColumns)
    .from(settlements)
    .innerJoin(orders, eq(orders.id, settlements.orderId))
    .where(and(eq(settlements.id, id), eq(settlements.sellerId, shopId)))

  if (!row) return null
  return { ...row, lines: await loadLines(row.orderId, row.sellerId) }
}

/** A shop's own payout history, newest delivery first. */
export async function getSellerSettlements(
  shopId: string,
  limit = 200,
): Promise<SettlementListRow[]> {
  return db
    .select(listColumns)
    .from(settlements)
    .innerJoin(orders, eq(orders.id, settlements.orderId))
    .where(eq(settlements.sellerId, shopId))
    .orderBy(desc(settlements.settledAt), desc(settlements.createdAt))
    .limit(limit)
}

/**
 * A "lot": every settlement for one shop delivered inside a date range.
 *
 * A query rather than a stored batch. Materialising the set would freeze rows
 * that can still be paid or voided afterwards, and the printed sheet would then
 * disagree with the live list. Voided rows are excluded — a cancelled order is
 * not money anyone owes.
 *
 * Ordered oldest first: a statement reads as a ledger, unlike a list where the
 * newest thing is what you came for.
 */
export async function getSellerStatement(
  sellerId: string,
  from: string,
  to: string,
): Promise<SettlementListRow[]> {
  return db
    .select(listColumns)
    .from(settlements)
    .innerJoin(orders, eq(orders.id, settlements.orderId))
    .where(
      and(
        eq(settlements.sellerId, sellerId),
        ne(settlements.status, 'void'),
        gte(settlements.settledAt, new Date(`${from}T00:00:00.000Z`)),
        lte(settlements.settledAt, endOfDay(to)),
      ),
    )
    .orderBy(asc(settlements.settledAt))
}

/** Approved and suspended shops, for the statement builder's picker. */
export async function getSettlementShops(): Promise<
  { id: string; shopName: string }[]
> {
  return db
    .select({
      id: wholesalerApplications.id,
      shopName: wholesalerApplications.shopName,
    })
    .from(wholesalerApplications)
    .where(ne(wholesalerApplications.status, 'rejected'))
    .orderBy(asc(wholesalerApplications.shopName))
}

/** Totals for a set of settlement rows — the foot of any list or statement. */
export function totalSettlements(rows: readonly SettlementListRow[]) {
  return rows.reduce(
    (sum, row) => ({
      gross: sum.gross + row.grossAmount,
      commission: sum.commission + row.commissionAmount,
      payout: sum.payout + row.payoutAmount,
      pieces: sum.pieces + row.pieceCount,
    }),
    { gross: 0, commission: 0, payout: 0, pieces: 0 },
  )
}
