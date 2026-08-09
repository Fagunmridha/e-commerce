/**
 * Money in this store is taka, everywhere — stored, computed and displayed.
 * There is no second currency and no conversion step: what an admin or a
 * seller types into a price field is exactly what a shopper pays.
 */

/**
 * Where a parcel is going. Delivery here is priced by zone, not by weight or
 * by distance, which is how the couriers this store hands off to quote it.
 */
export type DeliveryZone = 'dhaka' | 'outside'

/** Flat charge per zone. There is no free-delivery threshold. */
export const SHIPPING_RATES: Record<DeliveryZone, number> = {
  dhaka: 60,
  outside: 120,
}

/**
 * What to quote before a shopper has said where the parcel is going — the cart
 * drawer, a pre-order banner. The checkout form always asks, so this is only
 * ever an estimate, and it is the cheaper of the two on purpose: the number a
 * shopper sees on the way in should never be higher than what they are charged.
 */
export const DEFAULT_ZONE: DeliveryZone = 'dhaka'

/**
 * `zone` is deliberately required rather than defaulted. Every caller has to
 * say which zone it means, so a surface that forgets to ask fails to compile
 * instead of quietly quoting Dhaka rates to someone in Rangpur.
 */
export function getShippingCost(subtotal: number, zone: DeliveryZone): number {
  // An empty cart is not a ৳60 delivery.
  if (subtotal === 0) return 0
  return SHIPPING_RATES[zone]
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
