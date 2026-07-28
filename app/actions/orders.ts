'use server'

import { updateTag } from 'next/cache'
import { createOrder, type OrderItemInput } from '@/lib/orders'
import { getCurrentUser } from '@/lib/auth'
import type { PaymentMethod } from '@/lib/order'

export type PlaceOrderInput = {
  name: string
  phone: string
  address: string
  city: string
  notes?: string
  paymentMethod: PaymentMethod
  items: OrderItemInput[]
  /** The code only — the server prices the discount itself. */
  couponCode?: string | null
}

export async function placeOrder(
  input: PlaceOrderInput,
): Promise<{ orderNumber: string }> {
  // Guest checkout is allowed — userId is simply null when not signed in.
  const user = await getCurrentUser()
  const result = await createOrder({ ...input, userId: user?.id ?? null })
  // Stock was decremented — refresh the cached catalogue so availability stays right.
  updateTag('catalogue')
  // A redemption was spent, so the admin coupon list is out of date.
  updateTag('coupons')
  return result
}
