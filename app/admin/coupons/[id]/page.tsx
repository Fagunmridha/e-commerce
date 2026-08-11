import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CouponForm } from '@/components/admin/coupons/coupon-form'
import { SetBreadcrumbLabel } from '@/components/breadcrumb-label'
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
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <SetBreadcrumbLabel label={coupon.code} />
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
          <Link href="/admin/coupons">
            <ArrowLeft className="size-4" />
            All coupons
          </Link>
        </Button>
        <h2 className="text-xl font-bold text-foreground">
          Edit — <span className="font-mono">{coupon.code}</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Changes apply to every checkout from the moment you save.
        </p>
      </div>

      <CouponForm coupon={coupon} />
    </div>
  )
}
