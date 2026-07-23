'use server'

import { createOrder, type OrderItemInput } from '@/lib/orders'
import { getCurrentUser } from '@/lib/auth'
import type { PaymentMethod } from '@/lib/order'

export type PlaceOrderInput = {
  name: string
  phone: string
  email: string
  address: string
  city: string
  postcode?: string
  notes?: string
  paymentMethod: PaymentMethod
  items: OrderItemInput[]
}

export async function placeOrder(
  input: PlaceOrderInput,
): Promise<{ orderNumber: string }> {
  // Guest checkout is allowed — userId is simply null when not signed in.
  const user = await getCurrentUser()
  return createOrder({ ...input, userId: user?.id ?? null })
}
