import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrders } from '@/lib/orders'
import { getApplicationForUser } from '@/lib/wholesalers'
import type { WholesaleRole } from '@/lib/db/schema'

/**
 * What the /account pages share: who is signed in, which side of the wholesale
 * programme they joined, and where their application stands.
 *
 * Request-scoped, so the layout (for the sidebar) and the page under it (for
 * its own content) share one lookup instead of paying for it twice — each Neon
 * round trip is ~340ms here. Middleware has already required a session for
 * `/account`; the redirect is the belt to that pair of braces, for the moment a
 * Clerk session exists but the database row cannot be resolved.
 */

export type WholesaleStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

export type AccountContext = {
  name: string | null
  email: string
  /** ISO string — this crosses into a client component. */
  memberSince: string
  wholesaleRole: WholesaleRole | null
  /** Null when they have never applied. Only a seller has an application. */
  wholesaleStatus: WholesaleStatus | null
}

export const getAccountContext = cache(async function getAccountContext(): Promise<
  AccountContext & { userId: number }
> {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const application = await getApplicationForUser(user.id)

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    memberSince: user.createdAt.toISOString(),
    wholesaleRole: user.wholesaleRole ?? null,
    wholesaleStatus: application?.status ?? null,
  }
})

export type AccountOrder = {
  orderNumber: string
  /** ISO string. */
  placedAt: string
  status: string
  total: number
  itemCount: number
}

/** The signed-in user's orders, newest first, in the shape a client component takes. */
export const getAccountOrders = cache(async function getAccountOrders(): Promise<
  AccountOrder[]
> {
  const { userId } = await getAccountContext()
  const orders = await getUserOrders(userId)

  return orders.map((order) => ({
    orderNumber: order.orderNumber,
    placedAt: order.placedAt.toISOString(),
    status: order.status,
    total: order.total,
    itemCount: order.itemCount,
  }))
})
