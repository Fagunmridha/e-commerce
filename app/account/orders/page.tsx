import { AccountOrders } from '@/components/account/account-orders'
import { getAccountOrders } from '@/lib/account'

export default async function AccountOrdersPage() {
  return <AccountOrders orders={await getAccountOrders()} />
}
