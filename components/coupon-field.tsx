'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/components/language-provider'
import { useStore } from '@/components/store-provider'
import { cn } from '@/lib/utils'

/**
 * The discount-code control, shared by the cart drawer and the checkout
 * summary. All state lives in `useStore()`, so applying a code in the drawer
 * carries straight through to checkout — and the two can never drift apart.
 *
 * The amount shown here is a preview; `createOrder` re-checks the code and
 * prices the discount itself.
 */
export function CouponField({ className }: { className?: string }) {
  const { t, pick } = useLanguage()
  const { coupon, couponError, applyCoupon, clearCoupon } = useStore()
  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)

  async function submit() {
    if (!code.trim()) return
    setChecking(true)
    try {
      await applyCoupon(code)
    } finally {
      setChecking(false)
    }
  }

  if (coupon) {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-2 rounded-md bg-badge-new/10 px-3 py-2',
          className,
        )}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-badge-new">
            <span className="font-mono">{coupon.code}</span>{' '}
            <span className="font-normal">{t.coupon.applied}</span>
          </p>
          {coupon.description && (
            <p className="truncate text-xs text-muted-foreground">
              {pick(coupon.description)}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            clearCoupon()
            setCode('')
          }}
        >
          {t.coupon.remove}
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor="coupon-code"
        className="text-xs font-medium text-muted-foreground"
      >
        {t.coupon.label}
      </label>
      <div className="flex gap-2">
        <Input
          id="coupon-code"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          onKeyDown={(event) => {
            // On checkout this sits inside the order <form>; Enter here must
            // apply the code, not submit the order.
            if (event.key !== 'Enter') return
            event.preventDefault()
            void submit()
          }}
          placeholder={t.coupon.placeholder}
          className="h-9 font-mono uppercase"
        />
        <Button
          type="button"
          variant="outline"
          className="h-9"
          disabled={checking || !code.trim()}
          onClick={() => void submit()}
        >
          {checking ? t.coupon.applying : t.coupon.apply}
        </Button>
      </div>
      {couponError && (
        <p className="text-xs text-destructive">
          {t.coupon.errors[couponError]}
        </p>
      )}
    </div>
  )
}
