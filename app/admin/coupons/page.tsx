import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CouponsTable,
  type CouponRowView,
} from '@/components/admin/coupons/coupons-table'
import { getAllCoupons } from '@/lib/coupons'
import { couponStatus } from '@/lib/admin/coupon-status'
import { formatWindow } from '@/lib/admin/banner-status'

export const dynamic = 'force-dynamic'

export default async function AdminCouponsPage() {
  const rows = await getAllCoupons()
  const now = new Date()

  const coupons: CouponRowView[] = rows.map((row) => ({
    id: row.id,
    code: row.code,
    type: row.type,
    value: row.type === 'percent' ? `${row.value}%` : `$${row.value.toFixed(2)}`,
    minOrder: row.minOrder > 0 ? `$${row.minOrder.toFixed(2)}` : '—',
    window: formatWindow(row.startsAt, row.endsAt),
    usageLimit: row.usageLimit,
    usageCount: row.usageCount,
    usage:
      row.usageLimit === null
        ? `${row.usageCount} · no limit`
        : `${row.usageCount} / ${row.usageLimit}`,
    active: row.active,
    featured: row.featured,
    status: couponStatus(row, now),
  }))

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Coupons</h2>
          <p className="text-sm text-muted-foreground">
            Shoppers enter these at checkout. Every discount is re-checked on the
            server before the order is priced.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/coupons/new">
            <Plus className="size-4" />
            New coupon
          </Link>
        </Button>
      </div>

      <CouponsTable coupons={coupons} />
    </div>
  )
}
