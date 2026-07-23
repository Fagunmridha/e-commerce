import Link from 'next/link'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { orders, products, reviews, users } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export default async function AdminOverview() {
  const [
    [productRow],
    [orderRow],
    [userRow],
    [reviewRow],
    [revenue],
  ] = await Promise.all([
    db.select({ n: sql<string>`count(*)` }).from(products),
    db.select({ n: sql<string>`count(*)` }).from(orders),
    db.select({ n: sql<string>`count(*)` }).from(users),
    db.select({ n: sql<string>`count(*)` }).from(reviews),
    db.select({ total: sql<string>`coalesce(sum(${orders.total}), 0)` }).from(orders),
  ])

  const productCount = Number(productRow?.n ?? 0)
  const orderCount = Number(orderRow?.n ?? 0)
  const userCount = Number(userRow?.n ?? 0)
  const reviewCount = Number(reviewRow?.n ?? 0)

  const stats = [
    { label: 'Products', value: productCount, href: '/admin/products' },
    { label: 'Orders', value: orderCount, href: '/admin/orders' },
    { label: 'Customers', value: userCount, href: '/admin/users' },
    { label: 'Reviews', value: reviewCount, href: '#' },
    {
      label: 'Revenue (USD)',
      value: `$${Number(revenue?.total ?? 0).toFixed(2)}`,
      href: '/admin/orders',
    },
  ]

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-foreground">Overview</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary"
          >
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="mt-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {stat.label}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
