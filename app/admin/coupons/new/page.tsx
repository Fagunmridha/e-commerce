import { CouponForm } from '@/components/admin/coupons/coupon-form'

export const dynamic = 'force-dynamic'

export default function NewCouponPage() {
  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-foreground">New coupon</h2>
      <CouponForm />
    </div>
  )
}
