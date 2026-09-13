import type { ApprovalStatus } from '@/lib/types'

/**
 * Display state for a listing's review verdict. Stored, not derived — an admin
 * decides it — so like `wholesaler-status.ts` beside it there is nothing to
 * compute, only labels and the colours the badge uses. The two palettes match
 * on purpose: a pending shop and a pending listing are the same kind of wait.
 */
export const APPROVAL_LABEL: Record<ApprovalStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  approved: 'Live',
  rejected: 'Rejected',
  suspended: 'Suspended',
}

export const APPROVAL_CLASS: Record<ApprovalStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending: 'bg-amber-500/12 text-amber-700',
  approved: 'bg-emerald-500/12 text-emerald-700',
  rejected: 'bg-rose-500/12 text-rose-700',
  suspended: 'bg-muted text-muted-foreground',
}

/** The verdicts an admin may hand down — `draft` is the seller's, not theirs. */
export const APPROVAL_VERDICTS = [
  'pending',
  'approved',
  'rejected',
  'suspended',
] as const

export type ApprovalVerdict = (typeof APPROVAL_VERDICTS)[number]
