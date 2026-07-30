import {
  WholesalersTable,
  type WholesalerRowView,
} from '@/components/admin/wholesalers/wholesalers-table'
import { count, isNotNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import { getAllApplications } from '@/lib/wholesalers'
import { BUSINESS_TYPE_LABEL } from '@/lib/admin/wholesaler-status'

export const dynamic = 'force-dynamic'

export default async function AdminWholesalersPage() {
  // One GROUP BY beats N per-row lookups. These are live listings, not a queue
  // of proposals — sellers add and remove them from their own dashboard.
  const [rows, counts] = await Promise.all([
    getAllApplications(),
    db
      .select({ sellerId: products.sellerId, n: count() })
      .from(products)
      .where(isNotNull(products.sellerId))
      .groupBy(products.sellerId),
  ])

  const productCounts = new Map(
    counts.flatMap((row) => (row.sellerId ? [[row.sellerId, row.n] as const] : [])),
  )

  const applications: WholesalerRowView[] = rows.map((row) => ({
    id: row.id,
    shopName: row.shopName,
    contactName: row.contactName,
    phone: row.phone,
    email: row.email,
    city: row.city,
    businessType: row.businessType,
    businessTypeLabel: BUSINESS_TYPE_LABEL[row.businessType] ?? row.businessType,
    submitted: row.createdAt.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    products: productCounts.get(row.id) ?? 0,
    status: row.status,
  }))

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Wholesalers</h2>
        <p className="text-sm text-muted-foreground">
          Shops applying to sell here. Approving one opens their seller dashboard,
          from which they list their own stock at their own prices. Suspending
          hides every listing they have without deleting anything — deleting the
          shop is what removes their products for good.
        </p>
      </div>

      <WholesalersTable applications={applications} />
    </div>
  )
}
