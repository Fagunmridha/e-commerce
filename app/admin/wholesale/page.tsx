import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { WholesaleOverview } from '@/components/admin/wholesale/wholesale-overview'
import {
  getRecentWholesaleApplications,
  getRecentWholesaleOrders,
  getRecentWholesaleProductsForReview,
  getWholesaleOverviewStats,
} from '@/lib/wholesale/dashboard'

export const dynamic = 'force-dynamic'

/**
 * Wholesale landing page for admins — the four headline numbers plus the
 * three queues an admin is most likely to act on next.
 */
export default async function WholesaleDashboardPage() {
  const [stats, applications, pendingProducts, recentOrders] =
    await Promise.all([
      getWholesaleOverviewStats(),
      getRecentWholesaleApplications(5),
      getRecentWholesaleProductsForReview(5),
      getRecentWholesaleOrders(5),
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
          <CardTitle>Manage the wholesale catalog</CardTitle>
          <CardDescription>
            Trade lines, the categories filed under each, and the catalogues
            inside them. Anything created here shows up on /wholesale/market
            and inside a seller&apos;s product form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Open the manager to add a new trade line, or drill into an existing
            one to add a category or catalogue underneath it.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
