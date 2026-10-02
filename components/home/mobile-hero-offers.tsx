'use client'

import { CouponCard, WholesaleCard } from './hero'

export function MobileHeroOffers({ coupon, wholesaleStatus, wholesaleRole }: any) {
  return (
    <div className="sm:hidden my-4 px-4">
      <div className="grid gap-4">
        <WholesaleCard
          wholesaleStatus={wholesaleStatus}
          wholesaleRole={wholesaleRole}
        />
        <CouponCard coupon={coupon} />
      </div>
    </div>
  )
}
