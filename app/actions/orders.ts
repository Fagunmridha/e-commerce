'use server'

import { updateTag } from 'next/cache'
import { createOrder, type OrderItemInput } from '@/lib/orders'
import { getCurrentUser } from '@/lib/auth'
import {
  deliveryZoneSchema,
  preorderAdvanceSchema,
} from '@/lib/validation/checkout'
import { parseOrThrow } from '@/lib/validation/shared'
import type { DeliveryZone } from '@/lib/currency'
import type { AdvanceInput, PaymentMethod } from '@/lib/order'

export type PlaceOrderInput = {
  name: string
  phone: string
  address: string
  city: string
  /** The zone name only — the server looks up what it costs. */
  zone: DeliveryZone
  notes?: string
  paymentMethod: PaymentMethod
  items: OrderItemInput[]
  /** The code only — the server prices the discount itself. */
  couponCode?: string | null
  /**
   * Required when the order turns out to be a pre-order. The evidence of
   * payment only; `createOrder` decides how much was actually owed.
   */
  advance?: AdvanceInput
}

export async function placeOrder(
  input: PlaceOrderInput,
): Promise<{ orderNumber: string }> {
  // A server action is a public HTTP endpoint. The delivery fields are already
  // re-validated downstream by the database's own constraints, but the advance
  // is free-text that ends up in front of an admin, so it is parsed here — the
  // same `parseOrThrow` discipline every action in `admin.ts` follows.
  const advance = input.advance
    ? parseOrThrow(preorderAdvanceSchema, input.advance)
    : undefined

  // The zone is the one delivery field that is money rather than text: it picks
  // the rate the order is charged at. An unrecognised value would index
  // `SHIPPING_RATES` to undefined and quietly produce a NaN total, so it is
  // parsed here rather than trusted.
  const zone = parseOrThrow(deliveryZoneSchema, input.zone)

  // Guest checkout is allowed — userId is simply null when not signed in.
  const user = await getCurrentUser()
  const result = await createOrder({
    ...input,
    zone,
    advance,
    userId: user?.id ?? null,
  })
  // Stock was decremented — refresh the cached catalogue so availability stays right.
  updateTag('catalogue')
  // A redemption was spent, so the admin coupon list is out of date.
  updateTag('coupons')
  return result
}
