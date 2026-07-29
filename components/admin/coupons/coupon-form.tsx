'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { upsertCoupon } from '@/app/actions/coupons'
import { computeTotals, type PublicCoupon } from '@/lib/coupon-math'
import {
  COUPON_STATUS_CLASS,
  COUPON_STATUS_LABEL,
  couponStatus,
} from '@/lib/admin/coupon-status'
import type { CouponRow } from '@/lib/db/schema'

/**
 * `<input type="datetime-local">` speaks local wall-clock time with no zone.
 * `toISOString()` would shift by the UTC offset and quietly move a campaign by
 * hours, so the value is assembled from the local parts instead.
 */
function toLocalInput(date: Date | null): string {
  if (!date) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromLocalInput(value: string): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Human-typeable: no O/0 or I/1 confusion. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateCode(): string {
  let suffix = ''
  for (let index = 0; index < 5; index += 1) {
    suffix += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return `SAVE-${suffix}`
}

/** The order size the worked example below is priced against. */
const EXAMPLE_SUBTOTAL = 120

export function CouponForm({ coupon }: { coupon?: CouponRow }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const isEdit = Boolean(coupon)

  const [form, setForm] = useState({
    code: coupon?.code ?? '',
    descriptionEn: coupon?.description?.en ?? '',
    descriptionBn: coupon?.description?.bn ?? '',
    type: coupon?.type ?? 'percent',
    value: coupon?.value?.toString() ?? '',
    minOrder: coupon?.minOrder?.toString() ?? '0',
    maxDiscount: coupon?.maxDiscount?.toString() ?? '',
    startsAt: toLocalInput(coupon?.startsAt ?? null),
    endsAt: toLocalInput(coupon?.endsAt ?? null),
    usageLimit: coupon?.usageLimit?.toString() ?? '',
    active: coupon?.active ?? true,
    featured: coupon?.featured ?? false,
  })

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const isPercent = form.type === 'percent'

  const status = couponStatus({
    active: form.active,
    startsAt: fromLocalInput(form.startsAt),
    endsAt: fromLocalInput(form.endsAt),
    usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
    usageCount: coupon?.usageCount ?? 0,
  })

  // Priced with the exact function the storefront uses, so what the admin is
  // shown here is what a shopper will see at checkout.
  const draft: PublicCoupon = {
    code: form.code || 'CODE',
    type: form.type,
    value: Number(form.value) || 0,
    minOrder: Number(form.minOrder) || 0,
    maxDiscount:
      isPercent && form.maxDiscount ? Number(form.maxDiscount) : null,
    description: null,
  }
  const example = computeTotals(EXAMPLE_SUBTOTAL, draft)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()

    setPending(true)
    try {
      await upsertCoupon({
        id: coupon?.id,
        code: form.code,
        description:
          form.descriptionEn.trim() || form.descriptionBn.trim()
            ? {
                en: form.descriptionEn.trim() || form.descriptionBn.trim(),
                bn: form.descriptionBn.trim() || form.descriptionEn.trim(),
              }
            : null,
        type: form.type,
        value: Number(form.value),
        minOrder: Number(form.minOrder) || 0,
        maxDiscount:
          isPercent && form.maxDiscount ? Number(form.maxDiscount) : null,
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        active: form.active,
        featured: form.featured,
      })
      toast.success(isEdit ? 'Coupon updated' : 'Coupon created')
      router.push('/admin/coupons')
      router.refresh()
    } catch (error) {
      setPending(false)
      toast.error(
        error instanceof Error ? error.message : 'Could not save coupon',
      )
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Code">
          <div className="flex gap-2">
            <Input
              value={form.code}
              onChange={(e) => set('code', e.target.value.toUpperCase())}
              placeholder="EID25"
              className="font-mono uppercase"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Generate a code"
              onClick={() => set('code', generateCode())}
            >
              <Wand2 className="size-4" />
            </Button>
          </div>
        </Field>
        <Field label="Discount type">
          <select
            value={form.type}
            onChange={(e) => set('type', e.target.value as 'percent' | 'fixed')}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="percent">Percentage off</option>
            <option value="fixed">Fixed amount off</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={isPercent ? 'Percentage' : 'Amount (USD)'}>
          <Input
            type="number"
            step={isPercent ? '1' : '0.01'}
            min={0}
            max={isPercent ? 100 : undefined}
            value={form.value}
            onChange={(e) => set('value', e.target.value)}
          />
        </Field>
        <Field label="Minimum order (USD)">
          <Input
            type="number"
            step="0.01"
            min={0}
            value={form.minOrder}
            onChange={(e) => set('minOrder', e.target.value)}
          />
        </Field>
        <Field
          label="Max discount (USD)"
          hint={isPercent ? 'Blank for no cap' : 'Percentage coupons only'}
        >
          <Input
            type="number"
            step="0.01"
            min={0}
            disabled={!isPercent}
            value={isPercent ? form.maxDiscount : ''}
            onChange={(e) => set('maxDiscount', e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Description (English)" hint="Shown on the checkout chip">
          <Input
            value={form.descriptionEn}
            onChange={(e) => set('descriptionEn', e.target.value)}
            placeholder="Eid special — 20% off everything"
          />
        </Field>
        <Field label="Description (Bangla)">
          <Input
            value={form.descriptionBn}
            onChange={(e) => set('descriptionBn', e.target.value)}
          />
        </Field>
      </div>

      <div className="rounded-lg border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Availability</p>
            <p className="text-xs text-muted-foreground">
              Leave the dates blank to run until you turn it off.
            </p>
          </div>
          <Badge
            variant="secondary"
            className={`border-0 ${COUPON_STATUS_CLASS[status]}`}
          >
            {COUPON_STATUS_LABEL[status]}
          </Badge>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Starts">
            <Input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => set('startsAt', e.target.value)}
            />
          </Field>
          <Field label="Ends">
            <Input
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => set('endsAt', e.target.value)}
            />
          </Field>
          <Field label="Usage limit" hint="Blank for unlimited">
            <Input
              type="number"
              min={1}
              value={form.usageLimit}
              onChange={(e) => set('usageLimit', e.target.value)}
            />
          </Field>
        </div>

        {isEdit && (
          <p className="mt-3 text-xs text-muted-foreground">
            Redeemed {coupon?.usageCount ?? 0} time
            {coupon?.usageCount === 1 ? '' : 's'} so far. Editing never resets
            this count.
          </p>
        )}

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <Switch
              id="coupon-active"
              checked={form.active}
              onCheckedChange={(checked) => set('active', checked)}
            />
            <Label htmlFor="coupon-active" className="cursor-pointer">
              Active
            </Label>
          </div>

          <div className="flex items-start gap-3">
            <Switch
              id="coupon-featured"
              checked={form.featured}
              onCheckedChange={(checked) => set('featured', checked)}
              className="mt-0.5"
            />
            <div>
              <Label htmlFor="coupon-featured" className="cursor-pointer">
                Show on homepage
              </Label>
              <p className="text-xs text-muted-foreground">
                Puts the code on the hero offer card while the coupon is live.
                Anyone can then use it, so it will burn through a usage limit
                faster.
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="rounded-lg bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
        {example.discount > 0 ? (
          <>
            On a <strong>${EXAMPLE_SUBTOTAL.toFixed(2)}</strong> order this
            saves <strong>${example.discount.toFixed(2)}</strong> — the customer
            pays <strong>${example.total.toFixed(2)}</strong> including{' '}
            {example.shipping === 0
              ? 'free delivery'
              : `$${example.shipping.toFixed(2)} delivery`}
            .
          </>
        ) : (
          <>
            On a ${EXAMPLE_SUBTOTAL.toFixed(2)} order this coupon takes nothing
            off — check the discount amount and the minimum order.
          </>
        )}
      </p>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {isEdit ? 'Save changes' : 'Create coupon'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/coupons')}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
