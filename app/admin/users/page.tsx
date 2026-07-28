import { getCurrentUser } from '@/lib/auth'
import { getCustomers } from '@/lib/admin/customers'
import {
  CustomersTable,
  type CustomerRowView,
} from '@/components/admin/customers/customers-table'

export const dynamic = 'force-dynamic'

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  const { role } = await searchParams
  const me = await getCurrentUser()
  const all = await getCustomers()

  // The sidebar's "Admins" entry deep-links here with ?role=admin, so the
  // filter is applied server-side rather than left to the table's facet.
  const activeRole = role === 'admin' || role === 'customer' ? role : undefined
  const rows = activeRole
    ? all.filter((row) => row.role === activeRole)
    : all

  const customers: CustomerRowView[] = rows.map((row) => ({
    id: row.id,
    name: row.name || '—',
    email: row.email,
    role: row.role,
    orderCount: row.orderCount,
    lifetimeValue: row.lifetimeValue,
    lastOrderAt: row.lastOrderAt?.toISOString() ?? null,
    isSelf: me?.id === row.id,
  }))

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">
          {activeRole === 'admin' ? 'Admins' : 'Customers'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {customers.length} account{customers.length === 1 ? '' : 's'} ·
          lifetime value excludes cancelled orders.
        </p>
      </div>

      <CustomersTable customers={customers} />
    </div>
  )
}
