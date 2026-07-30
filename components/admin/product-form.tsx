'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageUploader } from '@/components/admin/image-uploader'
import { upsertProduct, type ProductInput } from '@/app/actions/admin'
import type { CategorySlug, Product } from '@/lib/types'
import type { Localized } from '@/lib/i18n'

const CATEGORIES: CategorySlug[] = ['men', 'women', 'kids', 'accessories']

/** "Black|কালো, White|সাদা" → [{en,bn}]. Bangla falls back to English. */
function parseColors(input: string): Localized[] | null {
  const items = input
    .split(',')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [en, bn] = chunk.split('|').map((part) => part.trim())
      return { en, bn: bn || en }
    })
  return items.length ? items : null
}

function serializeColors(colors?: Localized[]): string {
  return (colors ?? []).map((color) => `${color.en}|${color.bn}`).join(', ')
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const isEdit = Boolean(product)

  const [form, setForm] = useState({
    id: product?.id ?? '',
    nameEn: product?.name.en ?? '',
    nameBn: product?.name.bn ?? '',
    price: product?.price?.toString() ?? '',
    oldPrice: product?.oldPrice?.toString() ?? '',
    image: product?.image ?? '',
    category: (product?.category ?? 'men') as CategorySlug,
    badge: product?.badge ?? '',
    stock: product?.stock?.toString() ?? '0',
    // Undefined on the type when it is 1 (see lib/products.ts), but the field
    // should read "1" rather than blank.
    moq: (product?.moq ?? 1).toString(),
    sizes: product?.sizes?.join(', ') ?? '',
    colors: serializeColors(product?.colors),
    descriptionEn: product?.description?.en ?? '',
    descriptionBn: product?.description?.bn ?? '',
  })

  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }))

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!form.id.trim() || !form.nameEn.trim() || !form.image.trim()) {
      toast.error('ID, English name and image are required')
      return
    }

    const payload: ProductInput = {
      id: form.id.trim(),
      name: { en: form.nameEn.trim(), bn: form.nameBn.trim() || form.nameEn.trim() },
      price: Number(form.price) || 0,
      oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
      image: form.image.trim(),
      category: form.category,
      badge: form.badge ? (form.badge as 'new' | 'sale') : null,
      sizes: form.sizes
        ? form.sizes.split(',').map((s) => s.trim()).filter(Boolean)
        : null,
      colors: parseColors(form.colors),
      description:
        form.descriptionEn || form.descriptionBn
          ? {
              en: form.descriptionEn.trim(),
              bn: form.descriptionBn.trim() || form.descriptionEn.trim(),
            }
          : null,
      stock: Number(form.stock) || 0,
      moq: Number(form.moq) || 1,
    }

    setPending(true)
    try {
      await upsertProduct(payload)
      toast.success(isEdit ? 'Product updated' : 'Product created')
      router.push('/admin/products')
      router.refresh()
    } catch {
      setPending(false)
      toast.error('Could not save product')
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Product ID">
          <Input
            value={form.id}
            onChange={(e) => set('id', e.target.value)}
            disabled={isEdit}
            placeholder="e.g. 17"
          />
        </Field>
        <Field label="Category">
          <select
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm capitalize outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {CATEGORIES.map((slug) => (
              <option key={slug} value={slug} className="capitalize">
                {slug}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name (English)">
          <Input value={form.nameEn} onChange={(e) => set('nameEn', e.target.value)} />
        </Field>
        <Field label="Name (Bangla)">
          <Input value={form.nameBn} onChange={(e) => set('nameBn', e.target.value)} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Price (৳)">
          <Input
            type="number"
            step="1"
            value={form.price}
            onChange={(e) => set('price', e.target.value)}
          />
        </Field>
        <Field label="Old price (optional)">
          <Input
            type="number"
            step="1"
            value={form.oldPrice}
            onChange={(e) => set('oldPrice', e.target.value)}
          />
        </Field>
        <Field label="Stock">
          <Input
            type="number"
            value={form.stock}
            onChange={(e) => set('stock', e.target.value)}
          />
        </Field>
      </div>

      <ImageUploader
        value={form.image}
        onChange={(url) => set('image', url)}
        folder="products"
        label="Product image"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Badge">
          <select
            value={form.badge}
            onChange={(e) => set('badge', e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">None</option>
            <option value="new">New</option>
            <option value="sale">Sale</option>
          </select>
        </Field>
        <Field label="Sizes (comma separated)">
          <Input
            value={form.sizes}
            onChange={(e) => set('sizes', e.target.value)}
            placeholder="S, M, L, XL"
          />
        </Field>
      </div>

      <Field label="Minimum order (pieces)">
        <Input
          type="number"
          min={1}
          value={form.moq}
          onChange={(e) => set('moq', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          1 means no minimum. Enforced in the cart and again at checkout.
        </p>
      </Field>

      <Field label="Colors (English|Bangla, comma separated)">
        <Input
          value={form.colors}
          onChange={(e) => set('colors', e.target.value)}
          placeholder="Black|কালো, White|সাদা"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Description (English)">
          <Textarea
            rows={3}
            value={form.descriptionEn}
            onChange={(e) => set('descriptionEn', e.target.value)}
          />
        </Field>
        <Field label="Description (Bangla)">
          <Textarea
            rows={3}
            value={form.descriptionBn}
            onChange={(e) => set('descriptionBn', e.target.value)}
          />
        </Field>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {isEdit ? 'Save changes' : 'Create product'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/products')}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
