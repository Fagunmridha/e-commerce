'use client'

import Link from 'next/link'
import { Store, Clock, Package, AlertTriangle } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/admin/dashboard/stat-card'
import {
  WHOLESALER_STATUS_CLASS,
  WHOLESALER_STATUS_LABEL,
  type WholesalerStatus,
} from '@/lib/admin/wholesaler-status'
import { formatPrice } from '@/lib/currency'
import type {
  RecentApplication,
  RecentPendingProduct,
  RecentWholesaleOrder,
  WholesaleOverviewStats,
} from '@/lib/wholesale/dashboard'

/**
 * Wholesale dashboard body. Receives all counts and rows from the server
 * component beside it — these tables are read once per render and never
 * re-fetched client-side.
 */
export function WholesaleOverview({
  stats,
  applications,
  pendingProducts,
  recentOrders,
}: {
  stats: WholesaleOverviewStats
  applications: RecentApplication[]
  pendingProducts: RecentPendingProduct[]
  recentOrders: RecentWholesaleOrder[]
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total sellers"
          value={stats.totalSellers.toLocaleString('en-IN')}
          icon="customers"
          accent="emerald"
          href="/admin/wholesalers?status=approved"
        />
        <StatCard
          label="Pending applications"
          value={stats.pendingApplications.toLocaleString('en-IN')}
          hint="Awaiting review"
          icon="pending"
          accent="amber"
          href="/admin/wholesalers?status=pending"
        />
        <StatCard
          label="Wholesale products"
          value={stats.wholesaleProducts.toLocaleString('en-IN')}
          hint="Marketplace listings"
          icon="products"
          accent="violet"
          href="/admin/products/review"
        />
        <StatCard
          label="Pending product approvals"
          value={stats.pendingProductApprovals.toLocaleString('en-IN')}
          hint="Seller submissions"
          icon="alert"
          accent="rose"
          href="/admin/products/review"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RecentApplicationsCard applications={applications} />
        <RecentPendingProductsCard products={pendingProducts} />
        <RecentOrdersCard orders={recentOrders} />
      </div>
    </div>
  )
}

function RecentApplicationsCard({
  applications,
}: {
  applications: RecentApplication[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="size-4 text-muted-foreground" aria-hidden />
          Recent applications
        </CardTitle>
        <CardDescription>The latest five submissions.</CardDescription>
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <Empty>No applications yet.</Empty>
        ) : (
          <ul className="space-y-3">
            {applications.map((application) => (
              <li key={application.id} className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/admin/wholesalers/${application.id}`}
                    className="line-clamp-1 text-sm font-medium text-foreground hover:underline"
                  >
                    {application.shopName}
                  </Link>
                  <Badge
                    className={WHOLESALER_STATUS_CLASS[application.status as WholesalerStatus]}
                  >
                    {WHOLESALER_STATUS_LABEL[application.status as WholesalerStatus]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {application.contactName} · {application.tradeLines || '—'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeDate(application.submitted)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function RecentPendingProductsCard({
  products,
}: {
  products: RecentPendingProduct[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="size-4 text-muted-foreground" aria-hidden />
          Pending product approvals
        </CardTitle>
        <CardDescription>Seller submissions awaiting a verdict.</CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <Empty>Nothing waiting for review.</Empty>
        ) : (
          <ul className="space-y-3">
            {products.map((product) => (
              <li key={product.id} className="space-y-1">
                <Link
                  href={`/admin/products/${product.id}`}
                  className="line-clamp-1 text-sm font-medium text-foreground hover:underline"
                >
                  {product.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {product.shopName} · {product.category}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(product.price)}{' '}
                  {product.submittedAt
                    ? `· ${formatRelativeDate(product.submittedAt)}`
                    : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function RecentOrdersCard({
  orders,
}: {
  orders: RecentWholesaleOrder[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" aria-hidden />
          Recent wholesale orders
        </CardTitle>
        <CardDescription>
          Orders containing at least one marketplace product.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <Empty>No wholesale orders yet.</Empty>
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <li key={order.id} className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="line-clamp-1 text-sm font-medium text-foreground hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                  <span className="text-sm font-semibold text-foreground">
                    {formatPrice(order.total)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {order.customer} · {order.itemCount} item
                  {order.itemCount === 1 ? '' : 's'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeDate(order.placedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}

/**
 * Short, friendly relative date for list rows — the full timestamp would
 * crowd a one-line summary, and "3 days ago" reads better at a glance than
 * "2024-09-14T08:11:00Z".
 */
function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
