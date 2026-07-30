import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { StatCard } from '@/components/admin/dashboard/stat-card'
import {
  CategoryChart,
  SalesChart,
  TopProductsChart,
} from '@/components/admin/dashboard/charts'
import { RecentOrdersTable } from '@/components/admin/dashboard/recent-orders'
import {
  getDashboardStats,
  getMonthlySales,
  getRecentOrders,
  getSalesByCategory,
  getTopProducts,
} from '@/lib/admin/stats'
import { formatPrice } from '@/lib/currency'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [stats, monthly, byCategory, topProducts, recentOrders] =
    await Promise.all([
      getDashboardStats(),
      getMonthlySales(),
      getSalesByCategory(),
      getTopProducts(5),
      getRecentOrders(50),
    ])

  const money = formatPrice
  const revenueSeries = stats.sparkline.map((point) => point.revenue)
  const orderSeries = stats.sparkline.map((point) => point.orders)

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Everything happening in your store right now.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total revenue"
          value={money(stats.revenue.total)}
          icon="revenue"
          accent="violet"
          change={stats.revenue.change}
          series={revenueSeries}
          href="/admin/orders"
        />
        <StatCard
          label="Today's revenue"
          value={money(stats.revenue.today)}
          hint="Since midnight"
          icon="trending"
          accent="emerald"
          series={revenueSeries}
        />
        <StatCard
          label="Orders"
          value={String(stats.orders.total)}
          icon="orders"
          accent="sky"
          change={stats.orders.change}
          series={orderSeries}
          href="/admin/orders"
        />
        <StatCard
          label="Pending orders"
          value={String(stats.orders.pending)}
          hint="Awaiting processing"
          icon="pending"
          accent="amber"
          href="/admin/orders?status=pending"
        />
        <StatCard
          label="Products"
          value={String(stats.products.total)}
          hint={`${stats.products.lowStock} low on stock`}
          icon="products"
          accent="violet"
          href="/admin/products"
        />
        <StatCard
          label="Out of stock"
          value={String(stats.products.outOfStock)}
          hint="Needs restocking"
          icon="alert"
          accent="rose"
          href="/admin/products"
        />
        <StatCard
          label="Customers"
          value={String(stats.customers.total)}
          icon="customers"
          accent="emerald"
          change={stats.customers.change}
          href="/admin/users"
        />
        {/* Visitors and conversion rate need a web-analytics source. Vercel
            Analytics is mounted but exposes no query API, so rather than invent
            a number this card says what is missing. */}
        <Card className="gap-0 border-dashed py-0">
          <CardContent className="flex h-full flex-col justify-center p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Visitors &amp; conversion
            </p>
            <p className="mt-1.5 text-sm font-medium text-foreground">
              Not connected
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Needs an analytics source with a query API.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SalesChart data={monthly} />
        <CategoryChart data={byCategory} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <TopProductsChart data={topProducts} />

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>
              The latest {recentOrders.length} orders, newest first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentOrdersTable orders={recentOrders} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
