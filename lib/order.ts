export const LAST_ORDER_KEY = 'cp_last_order'

export type PaymentMethod = 'cod' | 'mobile' | 'card'

/** What the confirmation page needs. Replaced by a real orders table later. */
export type PlacedOrder = {
  orderNumber: string
  placedAt: string
  name: string
  phone: string
  address: string
  city: string
  paymentMethod: PaymentMethod
  /** Totals stay in USD; the page formats them in the active currency. */
  subtotal: number
  shipping: number
  total: number
  itemCount: number
}

export function createOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6)
  return `CP-${stamp}`
}

export function readLastOrder(): PlacedOrder | null {
  try {
    const raw = window.localStorage.getItem(LAST_ORDER_KEY)
    return raw ? (JSON.parse(raw) as PlacedOrder) : null
  } catch {
    return null
  }
}
