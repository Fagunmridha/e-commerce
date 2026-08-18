'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageUploader } from '@/components/admin/image-uploader'
import { LoadingOverlay } from '@/components/loading-overlay'
import { useLanguage } from '@/components/language-provider'
import { useCatalogue } from '@/components/catalogue-provider'
import { upsertSellerProduct } from '@/app/actions/seller-products'
import { splitCommission } from '@/lib/commission'
import { formatPrice } from '@/lib/currency'
import type { Product } from '@/lib/types'

/**
 * One listing, as its owner edits it.
 *
 * Plain `useState` rather than react-hook-form, matching the admin product form:
 * the fields are independent, the real validation is `sellerProductSchema` on the
 * server, and one of them is an uploader with its own state anyway.
 *
 * Narrower than the admin form on purpose — no old price, badge, colours or a
 * separate Bangla name. A seller sets what they sell and what it costs.
 */
export function SellerProductForm({
  product,
  defaultCommissionPct,
}: {
  product?: Product
  defaultCommissionPct: number
}) {
  const router = useRouter()
  const { t, pick } = useLanguage()
  const { categories } = useCatalogue()
  const copy = t.wholesale.dashboard

  const [pending, setPending] = useState(false)

  const [form, setForm] = useState({
    // The seller types one name, so the English side is the one to read back.
    name: product?.name.en ?? '',
    price: product?.price?.toString() ?? '',
    image: product?.image ?? '',
    category: product?.category ?? categories[0]?.slug ?? 'men',
    stock: product?.stock?.toString() ?? '',
    // `moq` is undefined on the type when it is 1 (see lib/products.ts), and the
    // field should read "1" rather than blank.
    moq: (product?.moq ?? 1).toString(),
    sizes: product?.sizes?.join(', ') ?? '',
    description: product?.description?.en ?? '',
  })

  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }))

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!form.name.trim() || !form.image.trim() || !form.price.trim()) {
      toast.error(copy.failed, { description: copy.required })
      return
    }

    setPending(true)
    const result = await upsertSellerProduct({
      id: product?.id ?? null,
      name: form.name.trim(),
      image: form.image.trim(),
      category: form.category,
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
      moq: Number(form.moq) || 1,
      sizes: form.sizes
        ? form.sizes.split(',').map((size) => size.trim()).filter(Boolean)
        : null,
      description: form.description.trim() || null,
    })

    if (!result.ok) {
      setPending(false)
      toast.error(copy.failed, { description: result.error })
      return
    }

    toast.success(copy.saved)
    router.push('/wholesale/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-5">
      <LoadingOverlay show={pending} label={copy.saving} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={copy.name}>
          <Input
            value={form.name}
            onChange={(event) => set('name', event.target.value)}
            placeholder={copy.namePlaceholder}
          />
        </Field>
        <Field label={copy.category}>
          <select
            value={form.category}
            onChange={(event) => set('category', event.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {pick(category.name)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={copy.price} hint={copy.priceHint}>
          <div className="space-y-2">
            <Input
              type="number"
              step="1"
              min={0}
              value={form.price}
              onChange={(event) => set('price', event.target.value)}
            />
            {(() => {
              const p = Number(form.price) || 0
              if (p > 0) {
                const pct = product?.commissionPct ?? defaultCommissionPct
                const { payout, commission } = splitCommission(p, pct)
                return (
                  <div className="rounded border border-border/50 bg-muted/50 p-2.5 text-xs text-muted-foreground shadow-sm">
                    <div className="flex justify-between font-medium text-foreground">
                      <span>You receive:</span>
                      <span className="text-primary">{formatPrice(payout)}</span>
                    </div>
                    <div className="mt-1 flex justify-between text-muted-foreground/80">
                      <span>Platform commission ({pct}%):</span>
                      <span>{formatPrice(commission)}</span>
                    </div>
                  </div>
                )
              }
              return null
            })()}
          </div>
        </Field>
        <Field label={copy.stock} hint={copy.stockHint}>
          <Input
            type="number"
            min={0}
            value={form.stock}
            onChange={(event) => set('stock', event.target.value)}
          />
        </Field>
        <Field label={copy.moq} hint={copy.moqHint}>
          <Input
            type="number"
            min={1}
            value={form.moq}
            onChange={(event) => set('moq', event.target.value)}
          />
        </Field>
      </div>

      <ImageUploader
        value={form.image}
        onChange={(url) => set('image', url)}
        folder="wholesale-products"
        label={copy.image}
      />

      <Field label={copy.sizes} hint={copy.sizesHint}>
        <Input
          value={form.sizes}
          onChange={(event) => set('sizes', event.target.value)}
          placeholder="S, M, L, XL"
        />
      </Field>

      <Field label={copy.description} hint={copy.descriptionHint}>
        <Textarea
          rows={3}
          value={form.description}
          onChange={(event) => set('description', event.target.value)}
        />
      </Field>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? copy.saving : copy.save}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/wholesale/dashboard')}
        >
          {copy.cancel}
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
