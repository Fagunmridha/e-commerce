'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Receipt, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { upsertCoupon } from '@/app/actions/coupons'
import { computeTotals, type PublicCoupon } from '@/lib/coupon-math'
import {
  COUPON_STATUS_CLASS,
  COUPON_STATUS_LABEL,
  couponStatus,
} from '@/lib/admin/coupon-status'
import type { CouponRow } from '@/lib/db/schema'
import { formatPrice } from '@/lib/currency'

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
const EXAMPLE_SUBTOTAL = 1500

/**
 * Numeric fields wear their unit in the padding on the right, so the browser's
 * own spinner — which would sit in exactly that spot — is turned off.
 */
const NUMBER_INPUT =
  'h-10 pr-8 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

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
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Discount</CardTitle>
          <CardDescription>
            The code a shopper types at checkout, and what it takes off.
          </CardDescription>
          <CardAction>
            <Badge
              variant="secondary"
              className={`border-0 ${COUPON_STATUS_CLASS[status]}`}
            >
              {COUPON_STATUS_LABEL[status]}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Code">
              <div className="flex gap-2">
                <Input
                  value={form.code}
                  onChange={(e) => set('code', e.target.value.toUpperCase())}
                  placeholder="EID25"
                  className="h-10 font-mono text-base uppercase tracking-wider"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Generate a code"
                      className="size-10 shrink-0"
                      onClick={() => set('code', generateCode())}
                    >
                      <Wand2 className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Generate a code</TooltipContent>
                </Tooltip>
              </div>
            </Field>
            <Field label="Discount type">
              <select
                value={form.type}
                onChange={(e) =>
                  set('type', e.target.value as 'percent' | 'fixed')
                }
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="percent">Percentage off</option>
                <option value="fixed">Fixed amount off</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field label={isPercent ? 'Percentage' : 'Amount'}>
              <Affix suffix={isPercent ? '%' : '৳'}>
                <Input
                  type="number"
                  step="1"
                  min={0}
                  max={isPercent ? 100 : undefined}
                  value={form.value}
                  onChange={(e) => set('value', e.target.value)}
                  className={NUMBER_INPUT}
                />
              </Affix>
            </Field>
            <Field label="Minimum order" hint="0 for any order size">
              <Affix suffix="৳">
                <Input
                  type="number"
                  step="1"
                  min={0}
                  value={form.minOrder}
                  onChange={(e) => set('minOrder', e.target.value)}
                  className={NUMBER_INPUT}
                />
              </Affix>
            </Field>
            <Field
              label="Max discount"
              hint={isPercent ? 'Blank for no cap' : 'Percentage coupons only'}
            >
              <Affix suffix="৳" muted={!isPercent}>
                <Input
                  type="number"
                  step="1"
                  min={0}
                  disabled={!isPercent}
                  value={isPercent ? form.maxDiscount : ''}
                  onChange={(e) => set('maxDiscount', e.target.value)}
                  className={NUMBER_INPUT}
                />
              </Affix>
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Wording</CardTitle>
          <CardDescription>
            Shown on the checkout chip once the code is accepted. Optional.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field label="Description (English)">
            <Input
              value={form.descriptionEn}
              onChange={(e) => set('descriptionEn', e.target.value)}
              placeholder="Eid special — 20% off everything"
              className="h-10"
            />
          </Field>
          <Field label="Description (Bangla)">
            <Input
              value={form.descriptionBn}
              onChange={(e) => set('descriptionBn', e.target.value)}
              placeholder="ঈদ অফার — সবকিছুতে ২০% ছাড়"
              className="h-10"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Availability</CardTitle>
          <CardDescription>
            Leave the dates blank to run until you turn it off.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Starts">
              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => set('startsAt', e.target.value)}
                className="h-10"
              />
            </Field>
            <Field label="Ends">
              <Input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => set('endsAt', e.target.value)}
                className="h-10"
              />
            </Field>
            <Field
              label="Usage limit"
              hint={
                isEdit
                  ? `Redeemed ${coupon?.usageCount ?? 0} time${
                      coupon?.usageCount === 1 ? '' : 's'
                    } — editing never resets this`
                  : 'Blank for unlimited'
              }
            >
              <Input
                type="number"
                min={1}
                value={form.usageLimit}
                onChange={(e) => set('usageLimit', e.target.value)}
                placeholder="Unlimited"
                className="h-10"
              />
            </Field>
          </div>

          <div className="divide-y divide-border rounded-lg border border-border">
            <Toggle
              id="coupon-active"
              label="Active"
              hint="Off keeps the coupon on file but stops it working at checkout."
              checked={form.active}
              onChange={(checked) => set('active', checked)}
            />
            <Toggle
              id="coupon-featured"
              label="Show on homepage"
              hint="Puts the code on the hero offer card while the coupon is live. Anyone can then use it, so it will burn through a usage limit faster."
              checked={form.featured}
              onChange={(checked) => set('featured', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3.5 text-sm">
        <Receipt className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-muted-foreground">
          {example.discount > 0 ? (
            <>
              On a{' '}
              <strong className="font-medium text-foreground">
                {formatPrice(EXAMPLE_SUBTOTAL)}
              </strong>{' '}
              order this saves{' '}
              <strong className="font-medium text-foreground">
                {formatPrice(example.discount)}
              </strong>{' '}
              — the customer pays{' '}
              <strong className="font-medium text-foreground">
                {formatPrice(example.total)}
              </strong>{' '}
              including{' '}
              {example.shipping === 0
                ? 'free delivery'
                : `${formatPrice(example.shipping)} delivery`}
              .
            </>
          ) : (
            <>
              On a {formatPrice(EXAMPLE_SUBTOTAL)} order this coupon takes
              nothing off — check the discount amount and the minimum order.
            </>
          )}
        </p>
      </div>

      {/* Sticks to the bottom of the viewport while the form is taller than it,
          so the save button is never a scroll away. */}
      <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-xl border border-border bg-background/85 px-4 py-3 shadow-lg backdrop-blur">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/admin/coupons')}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending} className="min-w-36">
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create coupon'}
        </Button>
      </div>
    </form>
  )
}

/** A unit chip welded to the right of a numeric input. */
function Affix({
  suffix,
  muted,
  children,
}: {
  suffix: string
  muted?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      {children}
      <span
        className={`pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm ${
          muted ? 'text-muted-foreground/50' : 'text-muted-foreground'
        }`}
      >
        {suffix}
      </span>
    </div>
  )
}

function Toggle({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string
  label: string
  hint: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-4">
      <div className="space-y-1">
        <Label htmlFor={id} className="cursor-pointer">
          {label}
        </Label>
        <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="mt-0.5 shrink-0"
      />
    </div>
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
