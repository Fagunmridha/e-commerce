import { notFound } from 'next/navigation'
import { CouponForm } from '@/components/admin/coupons/coupon-form'
import { getCouponById } from '@/lib/coupons'

export const dynamic = 'force-dynamic'

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const coupon = await getCouponById(id)
  if (!coupon) notFound()

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-foreground">
        Edit — <span className="font-mono">{coupon.code}</span>
      </h2>
      <CouponForm coupon={coupon} />
    </div>
  )
}
