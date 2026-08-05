/**
 * `advance_cod` is not something a shopper picks — it is what a pre-order
 * booking *is*, and `createOrder` sets it whenever the order turns out to be
 * one. It never appears in the cart checkout's method list.
 */
export type PaymentMethod = 'cod' | 'mobile' | 'card' | 'advance_cod'

/**
 * Admin-facing English labels. Three tables had their own copy of this map and
 * had already drifted apart on how to word `mobile`; one map means adding a
 * method is a compile error everywhere it is rendered rather than a silently
 * blank cell.
 *
 * The storefront does not use this — shoppers read `t.checkout.methods`, which
 * is translated.
 */
export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cod: 'Cash on delivery',
  mobile: 'Mobile banking (bKash / Nagad)',
  card: 'Card',
  advance_cod: 'Advance (bKash / Nagad) + cash on delivery',
}

export type AdvanceMethod = 'bkash' | 'nagad'

/** Where a booking's advance stands. `none` is every ordinary order. */
export type PaymentStatus =
  | 'none'
  | 'advance_pending'
  | 'advance_paid'
  | 'advance_failed'

export const ADVANCE_METHOD_LABEL: Record<AdvanceMethod, string> = {
  bkash: 'bKash',
  nagad: 'Nagad',
}

/** What the shopper reports after paying the advance by hand. No amount: that
 *  is recomputed server-side from the product's percentage. */
export type AdvanceInput = {
  method: AdvanceMethod
  trxId: string
  senderPhone: string
}
