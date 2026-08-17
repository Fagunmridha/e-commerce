import { lineCommissionPct, splitCommission } from '@/lib/commission'
import type { Locale, Localized } from '@/lib/i18n'
import type {
  DocumentRow,
  SettlementDocumentView,
} from '@/components/settlements/settlement-document'

/**
 * Turns stored settlement rows into what the document renders.
 *
 * Deliberately free of `server-only` and of any database import: the admin's
 * copy of a sheet and the seller's copy are built from the same rows by the
 * same function, so the two parties can never be shown different numbers for
 * the same trade. That is the whole point of the document.
 *
 * The input types live *here* rather than in `lib/settlements.ts`, which is
 * `server-only` — the seller's sheet is a client component (it needs the
 * dictionary and the locale), so it has to be able to name these shapes without
 * pulling a database module into the browser bundle. `lib/settlements.ts`
 * re-exports them.
 */

/** One line of a settlement, as the printed document itemises it. */
export type SettlementLine = {
  name: Localized
  image: string
  quantity: number
  size: string | null
  colorEn: string | null
  unitPrice: number
  commissionPct: number | null
}

export type SettlementDocumentStatus = 'pending' | 'due' | 'paid' | 'void'

/**
 * Everything a single settlement's sheet needs. Dates are `Date | string` so a
 * server component can hand the row straight over and a client component can
 * hand over the ISO strings it received across the boundary.
 */
export type SettlementDocumentInput = {
  settlementNumber: string
  orderNumber: string
  shopNameSnapshot: string
  status: SettlementDocumentStatus
  grossAmount: number
  commissionAmount: number
  payoutAmount: number
  settledAt: Date | string | null
  createdAt: Date | string
  paidAt: Date | string | null
  paidNote: string | null
  lines: SettlementLine[]
}

/** A settlement as a row of a period statement — no per-product lines. */
export type StatementRowInput = {
  orderNumber: string
  status: SettlementDocumentStatus
  grossAmount: number
  commissionAmount: number
  payoutAmount: number
  commissionPct: number | null
  pieceCount: number
  settledAt: Date | string | null
}

/** `1 Mar 2026`. Bangla gets Bangla numerals, matching the rest of the store. */
export function documentDate(
  value: Date | string | null | undefined,
  locale: Locale,
): string {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/** The variant descriptor under a product name — "M · Navy". */
function variantLabel(size: string | null, colorEn: string | null): string {
  return [size, colorEn].filter(Boolean).join(' · ')
}

/**
 * One settlement, itemised line by line.
 *
 * Each line is priced through `splitCommission` at its own snapshotted rate
 * rather than at the settlement's, so a sheet covering lines sold at 10% and
 * 15% shows each of them truthfully — and the column still adds up to the
 * stored total, because that total was built the same way at checkout.
 */
export function buildSettlementView(
  settlement: SettlementDocumentInput,
  pick: (value: Localized) => string,
  locale: Locale,
): SettlementDocumentView {
  const rows: DocumentRow[] = settlement.lines.map((line) => {
    const pct = lineCommissionPct(line)
    const split = splitCommission(line.unitPrice * line.quantity, pct)

    return {
      label: pick(line.name),
      sub: variantLabel(line.size, line.colorEn) || undefined,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      value: split.gross,
      ratePct: pct,
      commission: split.commission,
      payout: split.payout,
    }
  })

  return {
    variant: 'single',
    reference: settlement.settlementNumber,
    orderNumber: settlement.orderNumber,
    // The delivery date when there is one, so a reprint of an old sheet does
    // not claim to have been issued today.
    issuedOn: documentDate(settlement.settledAt ?? settlement.createdAt, locale),
    deliveredOn: settlement.settledAt
      ? documentDate(settlement.settledAt, locale)
      : undefined,
    shopName: settlement.shopNameSnapshot,
    rows,
    gross: settlement.grossAmount,
    commission: settlement.commissionAmount,
    payout: settlement.payoutAmount,
    status: settlement.status,
    paidOn: settlement.paidAt
      ? documentDate(settlement.paidAt, locale)
      : undefined,
    paidNote: settlement.paidNote,
  }
}

/**
 * A period's worth of settlements on one sheet — the "lot".
 *
 * Each row is a whole settlement rather than a product line: itemising every
 * line of thirty orders would run to pages, and the per-order sheet is one
 * click away for anything that needs checking. `ratePct` comes off the stored
 * column, which is null exactly when that settlement's own lines disagreed.
 *
 * The status is the *sheet's*, not any one row's: a period containing anything
 * still unpaid is not a paid statement.
 */
export function buildStatementView(
  rows: readonly StatementRowInput[],
  shopName: string,
  from: string,
  to: string,
  locale: Locale,
): SettlementDocumentView {
  const documentRows: DocumentRow[] = rows.map((row) => ({
    label: row.orderNumber,
    sub: documentDate(row.settledAt, locale),
    quantity: row.pieceCount,
    value: row.grossAmount,
    ratePct: row.commissionPct,
    commission: row.commissionAmount,
    payout: row.payoutAmount,
  }))

  const totals = rows.reduce(
    (sum, row) => ({
      gross: sum.gross + row.grossAmount,
      commission: sum.commission + row.commissionAmount,
      payout: sum.payout + row.payoutAmount,
    }),
    { gross: 0, commission: 0, payout: 0 },
  )

  const allPaid = rows.length > 0 && rows.every((row) => row.status === 'paid')

  return {
    variant: 'lot',
    reference: `${from} → ${to}`,
    issuedOn: documentDate(new Date(), locale),
    periodFrom: documentDate(from, locale),
    periodTo: documentDate(to, locale),
    shopName,
    rows: documentRows,
    gross: totals.gross,
    commission: totals.commission,
    payout: totals.payout,
    status: allPaid ? 'paid' : 'due',
    count: rows.length,
  }
}
