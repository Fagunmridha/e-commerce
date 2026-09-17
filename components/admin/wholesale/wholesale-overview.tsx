'use client'

import Link from 'next/link'
import { ArrowRight, Store, Clock, Package } from 'lucide-react'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

/** Same palette `RecentOrdersTable` uses on the main dashboard, so a status
 * reads the same colour everywhere in admin. */
const ORDER_STATUS: Record<
  RecentWholesaleOrder['status'],
  { label: string; className: string }
> = {
  pending: { label: 'Pending', className: 'bg-amber-500/12 text-amber-700' },
  processing: { label: 'Processing', className: 'bg-sky-500/12 text-sky-700' },
  shipped: { label: 'Shipped', className: 'bg-violet-500/12 text-violet-700' },
  delivered: {
    label: 'Delivered',
    className: 'bg-emerald-500/12 text-emerald-700',
  },
  cancelled: { label: 'Cancelled', className: 'bg-rose-500/12 text-rose-700' },
}

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
          hint="Approved shops"
          icon="customers"
          accent="emerald"
          href="/admin/wholesalers?status=approved"
          topAccent
        />
        <StatCard
          label="Pending applications"
          value={stats.pendingApplications.toLocaleString('en-IN')}
          hint="Awaiting review"
          icon="pending"
          accent="amber"
          href="/admin/wholesalers?status=pending"
          topAccent
        />
        <StatCard
          label="Wholesale products"
          value={stats.wholesaleProducts.toLocaleString('en-IN')}
          hint="Marketplace listings"
          icon="products"
          accent="violet"
          href="/admin/products/review"
          topAccent
        />
        <StatCard
          label="Pending product approvals"
          value={stats.pendingProductApprovals.toLocaleString('en-IN')}
          hint="Seller submissions"
          icon="alert"
          accent="rose"
          href="/admin/products/review"
          topAccent
        />
      </div>

      <div className="space-y-6">
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
        <div>
          <CardTitle className="flex items-center gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-sky-500/12 text-sky-600">
              <Store className="size-3.5" aria-hidden />
            </span>
            Recent applications
          </CardTitle>
          <CardDescription className="mt-1">
            The latest five submissions.
          </CardDescription>
        </div>
        <CardAction>
          <ViewAllLink href="/admin/wholesalers" />
        </CardAction>
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <Empty>No applications yet.</Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop</TableHead>
                <TableHead>Trade lines</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>
                    <Link
                      href={`/admin/wholesalers/${application.id}`}
                      className="text-sm font-medium text-foreground hover:underline"
                    >
                      {application.shopName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {application.contactName}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {application.tradeLines || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        WHOLESALER_STATUS_CLASS[
                          application.status as WholesalerStatus
                        ]
                      }
                    >
                      {
                        WHOLESALER_STATUS_LABEL[
                          application.status as WholesalerStatus
                        ]
                      }
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatRelativeDate(application.submitted)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
        <div>
          <CardTitle className="flex items-center gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-violet-500/12 text-violet-600">
              <Package className="size-3.5" aria-hidden />
            </span>
            Pending product approvals
          </CardTitle>
          <CardDescription className="mt-1">
            Seller submissions awaiting a verdict.
          </CardDescription>
        </div>
        <CardAction>
          <ViewAllLink href="/admin/products/review" />
        </CardAction>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <Empty>Nothing waiting for review.</Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="text-sm font-medium text-foreground hover:underline"
                    >
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {product.shopName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {product.category}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground">
                    {formatPrice(product.price)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {product.submittedAt
                      ? formatRelativeDate(product.submittedAt)
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
        <div>
          <CardTitle className="flex items-center gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-emerald-500/12 text-emerald-600">
              <Clock className="size-3.5" aria-hidden />
            </span>
            Recent wholesale orders
          </CardTitle>
          <CardDescription className="mt-1">
            Orders containing at least one marketplace product.
          </CardDescription>
        </div>
        <CardAction>
          <ViewAllLink href="/admin/orders" />
        </CardAction>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <Empty>No wholesale orders yet.</Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono text-xs font-semibold text-primary hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {order.customer}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {order.itemCount}
                  </TableCell>
                  <TableCell>
                    <Badge className={ORDER_STATUS[order.status].className}>
                      {ORDER_STATUS[order.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-foreground">
                    {formatPrice(order.total)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatRelativeDate(order.placedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function ViewAllLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
    >
      View all
      <ArrowRight className="size-3.5" aria-hidden="true" />
    </Link>
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
