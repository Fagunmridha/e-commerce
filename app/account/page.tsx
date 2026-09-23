import { AccountOverview } from '@/components/account/account-overview'
import { getAccountContext, getAccountOrders } from '@/lib/account'

export default async function AccountPage() {
  const [{ name, email, wholesaleRole, wholesaleStatus }, orders] =
    await Promise.all([getAccountContext(), getAccountOrders()])

  return (
    <AccountOverview
      name={name}
      email={email}
      orders={orders}
      wholesaleRole={wholesaleRole}
      wholesaleStatus={wholesaleStatus}
    />
  )
}
