/**
 * Display state for a wholesale application. The value is stored, not derived
 * — an admin decides it — so unlike `couponStatus` there is nothing to compute
 * here, only labels and the colours the badge uses.
 */
export type WholesalerStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'suspended'

export const WHOLESALER_STATUS_LABEL: Record<WholesalerStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended',
}

export const WHOLESALER_STATUS_CLASS: Record<WholesalerStatus, string> = {
  pending: 'bg-amber-500/12 text-amber-700 dark:text-amber-400',
  approved: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400',
  rejected: 'bg-rose-500/12 text-rose-700 dark:text-rose-400',
  suspended: 'bg-muted text-muted-foreground',
}

export const BUSINESS_TYPE_LABEL: Record<string, string> = {
  retail_shop: 'Retail shop',
  distributor: 'Distributor',
  online_seller: 'Online seller',
  other: 'Other',
}
