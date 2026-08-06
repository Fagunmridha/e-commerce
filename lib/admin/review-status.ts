/**
 * Display state for a customer review. Like `wholesalerStatus` and unlike
 * `couponStatus`, the value is stored rather than derived — an admin decides it
 * — so there is nothing to compute here, only labels and badge colours.
 */
export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

export const REVIEW_STATUS_CLASS: Record<ReviewStatus, string> = {
  pending: 'bg-amber-500/12 text-amber-700 dark:text-amber-400',
  approved: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400',
  rejected: 'bg-rose-500/12 text-rose-700 dark:text-rose-400',
}

export const REVIEW_STATUSES = ['pending', 'approved', 'rejected'] as const
