/**
 * Money in this store is taka, everywhere — stored, computed and displayed.
 * There is no second currency and no conversion step: what an admin or a
 * seller types into a price field is exactly what a shopper pays.
 */

/** Orders at or above this ship free. */
export const FREE_SHIPPING = 2000

/** Flat delivery charge on orders below the free-shipping threshold. */
export const SHIPPING_FLAT = 60

export function getShippingCost(subtotal: number): number {
  if (subtotal === 0 || subtotal >= FREE_SHIPPING) return 0
  return SHIPPING_FLAT
}

/**
 * `৳1,200`. Whole taka — nobody prices a shirt at ৳1,199.80.
 *
 * Grouped with `en-IN` rather than `en-US` so large amounts break at lakh and
 * crore (`1200000` → `12,00,000`), which is how the number is read here.
 */
export function formatPrice(amount: number): string {
  return `৳${Math.round(amount).toLocaleString('en-IN')}`
}
