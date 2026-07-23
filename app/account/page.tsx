import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AccountContent } from '@/components/account-content'
import { PageHeader } from '@/components/page-header'
import { pageMetadata } from '@/lib/metadata'
import { getCurrentUser } from '@/lib/auth'
import { getUserOrders } from '@/lib/orders'

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata('account')
}

export default async function AccountPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const orders = await getUserOrders(user.id)

  return (
    <>
      <PageHeader pageKey="account" />
      <AccountContent
        name={user.name}
        email={user.email}
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
