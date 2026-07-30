import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AccountContent } from '@/components/account-content'
import { PageHeader } from '@/components/page-header'
import { pageMetadata } from '@/lib/metadata'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrders } from '@/lib/orders'
import { getApplicationForUser } from '@/lib/wholesalers'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata('account')
}

export default async function AccountPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const [orders, application] = await Promise.all([
    getUserOrders(user.id),
    getApplicationForUser(user.id),
  ])

  return (
    <>
      <PageHeader pageKey="account" />
      <AccountContent
        name={user.name}
        email={user.email}
        wholesaleStatus={application?.status ?? null}
        orders={orders.map((order) => ({
          orderNumber: order.orderNumber,
          placedAt: order.placedAt.toISOString(),
          status: order.status,
          total: order.total,
          itemCount: order.itemCount,
        }))}
      />
    </>
  )
}
