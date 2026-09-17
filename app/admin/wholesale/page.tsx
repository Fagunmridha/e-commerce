import Link from 'next/link'
import { ArrowRight, FolderTree } from 'lucide-react'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WholesaleOverview } from '@/components/admin/wholesale/wholesale-overview'
import {
  getRecentWholesaleApplications,
  getRecentWholesaleOrders,
  getRecentWholesaleProductsForReview,
  getWholesaleCatalogSummary,
  getWholesaleOverviewStats,
} from '@/lib/wholesale/dashboard'

export const dynamic = 'force-dynamic'

/**
 * Wholesale landing page for admins — the four headline numbers plus the
 * three queues an admin is most likely to act on next.
 */
export default async function WholesaleDashboardPage() {
  const [stats, applications, pendingProducts, recentOrders, catalog] =
    await Promise.all([
      getWholesaleOverviewStats(),
      getRecentWholesaleApplications(5),
      getRecentWholesaleProductsForReview(5),
      getRecentWholesaleOrders(5),
      getWholesaleCatalogSummary(),
    ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Wholesale</h1>
        <p className="text-sm text-muted-foreground">
          Trade-line sellers, their applications, and the products they have
          submitted for review. Numbers reflect the marketplace side of the
          store; the regular shop is on the main dashboard.
        </p>
      </div>

      <WholesaleOverview
        stats={stats}
        applications={applications}
        pendingProducts={pendingProducts}
        recentOrders={recentOrders}
      />

      <Card>
        <CardHeader>
          <div className="flex gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-500/12 text-violet-600">
              <FolderTree className="size-4" aria-hidden="true" />
            </span>
            <div>
              <CardTitle>Manage the wholesale catalog</CardTitle>
              <CardDescription className="mt-1">
                Trade lines, the categories filed under each, and the
                catalogues inside them. Anything created here shows up on
                /wholesale/market and inside a seller&apos;s product form.
              </CardDescription>
            </div>
          </div>
          <CardAction>
            <Button asChild>
              <Link href="/admin/wholesale/catalog">
                Open manager
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <dl className="flex flex-wrap gap-x-8 gap-y-3 rounded-lg bg-muted/50 px-4 py-3">
            <div>
              <dt className="text-xs text-muted-foreground">Trade lines</dt>
              <dd className="text-lg font-semibold text-foreground">
                {catalog.tradeLines}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Categories</dt>
              <dd className="text-lg font-semibold text-foreground">
                {catalog.categories}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Catalogues</dt>
              <dd className="text-lg font-semibold text-foreground">
                {catalog.catalogues}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
