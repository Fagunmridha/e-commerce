/**
 * The marketplace commission maths, in one place.
 *
 * Deliberately free of `server-only` and of any database import — the admin's
 * product form previews a split while the rate is being typed, `createOrder`
 * decides it for real, and the settlement document restates it. This module
 * exists so those three cannot disagree. Same reasoning as `lib/coupon-math.ts`
 * and `lib/preorder.ts`.
 *
 * The model is *deducted, never added*: the buyer pays the price the shop set,
 * the store keeps a percentage of it, and the shop is paid the rest. Nothing
 * here touches checkout pricing — `products.price` is what it always was.
 */

/**
 * Applied to a marketplace listing that has no rate of its own.
 *
 * Ten, not zero. Unlike `DEFAULT_ADVANCE_PCT` — where the safe default is "ask
 * the shopper for nothing" — the safe default here is that a listing the admin
 * has not got round to still earns the store its cut. Forgetting to set a rate
 * should cost the store nothing, and it is one field away from being changed.
 */
export const DEFAULT_COMMISSION_PCT = 10

/**
 * The rate that applies to a listing today.
 *
 * `null`/`undefined` (an unset column) means the store default; a stored `0` is
 * a real choice — a shop the store carries at cost — and must not be collapsed
 * into the fallback, which is why this is not a plain `||`. Same care as
 * `advancePct`.
 */
export function commissionPct(product: {
  commissionPct?: number | null
}): number {
  const value = product.commissionPct
  if (value === undefined || value === null) return DEFAULT_COMMISSION_PCT
  return Math.min(100, Math.max(0, value))
}

/**
 * The rate a line was actually *sold* at, read off its snapshot.
 *
 * Null here means something different from null on a product: not "use the
 * default" but "no rate was ever agreed". It appears on house lines, and on
 * every line written before the column existed. Falling back to the store
 * default would invent a debt against sales that predate the whole scheme, so
 * it falls back to nothing.
 */
export function lineCommissionPct(line: {
  commissionPct: number | null
}): number {
  if (line.commissionPct === null) return 0
  return Math.min(100, Math.max(0, line.commissionPct))
}

/** Rounds to whole taka, so no two surfaces drift by an epsilon. */
function money(value: number): number {
  return Math.round(value)
}

/**
 * Splits a line's value into the store's cut and the shop's payout.
 *
 * `payout` is computed by subtraction rather than by a second rounding, so the
 * invariant every caller and every printed document relies on —
 * `commission + payout === gross` — holds exactly. Same discipline as
 * `splitPayment`.
 */
export function splitCommission(
  gross: number,
  pct: number,
): { gross: number; commission: number; payout: number } {
  const rounded = money(gross)
  const commission = Math.min(
    Math.max(0, money((rounded * Math.min(100, Math.max(0, pct))) / 100)),
    rounded,
  )
  return { gross: rounded, commission, payout: rounded - commission }
}

/** One sold line, as much of it as the commission maths needs. */
export type CommissionLine = {
  unitPrice: number
  quantity: number
  commissionPct: number | null
}

export type SettlementSummary = {
  gross: number
  commission: number
  payout: number
  /**
   * The single rate every line shared, or null when they differed — the
   * document then shows the effective blend instead of a number that is true
   * of none of the lines.
   */
  uniformPct: number | null
  pieces: number
  lineCount: number
}

/**
 * Rolls one shop's lines up into the numbers a settlement row and its document
 * carry.
 *
 * Rounded per line and *then* summed, not summed and then rounded: two lines
 * sold at different rates must each land where their own rate said, and the
 * per-line figures are exactly what the printed sheet itemises. Summing first
 * would leave the total disagreeing with the column above it by a taka.
 */
export function summariseSettlement(
  lines: readonly CommissionLine[],
): SettlementSummary {
  let gross = 0
  let commission = 0
  let payout = 0
  let pieces = 0

  for (const line of lines) {
    const split = splitCommission(
      line.unitPrice * line.quantity,
      lineCommissionPct(line),
    )
    gross += split.gross
    commission += split.commission
    payout += split.payout
    pieces += line.quantity
  }

  const rates = new Set(lines.map(lineCommissionPct))

  return {
    gross,
    commission,
    payout,
    uniformPct: rates.size === 1 ? [...rates][0] : null,
    pieces,
    lineCount: lines.length,
  }
}

/**
 * The rate a mixed-rate settlement worked out to, for display only. Never
 * stored — `settlements.commission_pct` stays null in that case, because the
 * per-line rates on `order_items` are the record.
 */
export function effectivePct(summary: SettlementSummary): number {
  if (summary.gross <= 0) return 0
  return Math.round((summary.commission / summary.gross) * 100)
}
