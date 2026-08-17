/**
 * Display state for a settlement. Stored, not derived — the order's status
 * moves it and an admin marks it paid — so there is nothing to compute here,
 * only labels and the colours the badge uses. Mirrors `wholesaler-status.ts`.
 */
export type SettlementStatus = 'pending' | 'due' | 'paid' | 'void'

export const SETTLEMENT_STATUSES: SettlementStatus[] = [
  'pending',
  'due',
  'paid',
  'void',
]

export const SETTLEMENT_STATUS_LABEL: Record<SettlementStatus, string> = {
  pending: 'Upcoming',
  due: 'Due',
  paid: 'Paid',
  void: 'Cancelled',
}

export const SETTLEMENT_STATUS_CLASS: Record<SettlementStatus, string> = {
  pending: 'bg-sky-500/12 text-sky-700',
  due: 'bg-amber-500/12 text-amber-700',
  paid: 'bg-emerald-500/12 text-emerald-700',
  void: 'bg-muted text-muted-foreground',
}
