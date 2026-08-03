import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CouponForm } from '@/components/admin/coupons/coupon-form'

export const dynamic = 'force-dynamic'

export default function NewCouponPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
          <Link href="/admin/coupons">
            <ArrowLeft className="size-4" />
            All coupons
          </Link>
        </Button>
        <h2 className="text-xl font-bold text-foreground">New coupon</h2>
        <p className="text-sm text-muted-foreground">
          Every discount is re-checked on the server before an order is priced.
        </p>
      </div>

      <CouponForm />
    </div>
  )
}
