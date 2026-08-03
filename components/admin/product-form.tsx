'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageUploader } from '@/components/admin/image-uploader'
import { upsertProduct, type ProductInput } from '@/app/actions/admin'
import type { CategorySlug, Product, ProductColor } from '@/lib/types'
import type { Localized } from '@/lib/i18n'

const CATEGORIES: CategorySlug[] = ['men', 'women', 'kids', 'accessories']

/**
 * "Black|কালো|#111827, Print|প্রিন্ট" → [{ name: {en,bn}, hex? }].
 *
 * Bangla falls back to English. The hex segment is optional and simply omitted
 * when blank, so a colourway with no swatch stores no `hex` key at all — one
 * representation of "no hex", which is what `isSwatchable` relies on. The server
 * re-validates the hex (`hexColorSchema`); this only shapes it.
 */
function parseColors(input: string): ProductColor[] | null {
  const items = input
    .split(',')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [en, bn, hex] = chunk.split('|').map((part) => part.trim())
      const name = { en, bn: bn || en }
      return hex ? { name, hex } : { name }
    })
  return items.length ? items : null
}

/**
 * Round-trips `parseColors`. No trailing "|" when there is no hex, so opening an
 * untouched product and saving it does not rewrite its colours.
 */
function serializeColors(colors?: ProductColor[]): string {
  return (colors ?? [])
    .map((color) =>
      color.hex
        ? `${color.name.en}|${color.name.bn}|${color.hex}`
        : `${color.name.en}|${color.name.bn}`,
    )
    .join(', ')
}

/** One highlight per line, "English|Bangla". Bangla falls back to English. */
function parseHighlights(input: string): Localized[] | null {
  const items = input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [en, bn] = line.split('|').map((part) => part.trim())
      return { en, bn: bn || en }
    })
  return items.length ? items : null
}

function serializeHighlights(highlights?: Localized[]): string {
  return (highlights ?? [])
    .map((item) => `${item.en}|${item.bn}`)
    .join('\n')
}

export function ProductForm({
  product,
  gallery = [],
}: {
  product?: Product
  /** Extra shots beyond `product.image`, in position order. */
  gallery?: string[]
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const isEdit = Boolean(product)

  // Kept outside the main form object: it is a growable list whose rows are
  // uploaders with their own progress state.
  const [shots, setShots] = useState<string[]>(gallery)

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
    highlights: serializeHighlights(product?.highlights),
    descriptionEn: product?.description?.en ?? '',
    descriptionBn: product?.description?.bn ?? '',
    preorder: product?.preorder ?? false,
    // The column is a `date`, so this is already the `YYYY-MM-DD` that
    // <input type="date"> wants — no parsing or reformatting in between.
    preorderShipsAt: product?.preorderShipsAt ?? '',
  })

  // Generic over the key so `preorder` can be a boolean while the rest stay
  // strings, instead of every field being stringly typed for the sake of one.
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!form.id.trim() || !form.nameEn.trim() || !form.image.trim()) {
      toast.error('ID, English name and image are required')
      return
    }

    // The server rejects this too; catching it here saves a round trip and
    // points at the field rather than surfacing a generic save failure.
    if (form.preorder && !form.preorderShipsAt) {
      toast.error('A pre-order product needs a delivery date')
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
      highlights: parseHighlights(form.highlights),
      // Blank uploader rows are dropped rather than saved as empty URLs.
      gallery: shots.map((url) => url.trim()).filter(Boolean),
      description:
        form.descriptionEn || form.descriptionBn
          ? {
              en: form.descriptionEn.trim(),
              bn: form.descriptionBn.trim() || form.descriptionEn.trim(),
            }
          : null,
      stock: Number(form.stock) || 0,
      moq: Number(form.moq) || 1,
      preorder: form.preorder,
      preorderShipsAt: form.preorder ? form.preorderShipsAt : null,
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
    <form onSubmit={onSubmit} className="space-y-5">
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
        <Field
          label={form.preorder ? 'Limited stock (pieces)' : 'Stock'}
        >
          <Input
            type="number"
            min={0}
            value={form.stock}
            onChange={(e) => set('stock', e.target.value)}
          />
          {form.preorder && (
            <p className="text-xs text-muted-foreground">
              The run you are opening bookings for. Counts down as pre-orders
              come in; at zero the card shows sold out.
            </p>
          )}
        </Field>
      </div>

      <ImageUploader
        value={form.image}
        onChange={(url) => set('image', url)}
        folder="products"
        label="Primary image"
      />

      <div className="space-y-3">
        <Label>Gallery</Label>
        <p className="text-xs text-muted-foreground">
          Extra shots of this product, shown as thumbnails after the primary
          image. Leave empty and the detail page shows a single photo with no
          thumbnail strip.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {shots.map((url, index) => (
            <div key={index} className="space-y-2">
              <ImageUploader
                value={url}
                onChange={(next) =>
                  setShots((current) =>
                    current.map((item, i) => (i === index ? next : item)),
                  )
                }
                folder="products"
                label={`Shot ${index + 2}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setShots((current) => current.filter((_, i) => i !== index))
                }
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
        {shots.length < 8 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShots((current) => [...current, ''])}
          >
            <Plus className="size-4" />
            Add a shot
          </Button>
        )}
      </div>

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

      <div className="space-y-3 rounded-lg border border-border p-4">
        <label className="flex items-center gap-2.5 text-sm font-medium">
          <input
            type="checkbox"
            checked={form.preorder}
            onChange={(e) => set('preorder', e.target.checked)}
            className="size-4 accent-button"
          />
          Pre-order (Coming Soon)
        </label>
        <p className="text-xs text-muted-foreground">
          Moves this product out of the shop, category pages and search, and
          into the homepage Coming Soon rail. Customers book it now and it ships
          from the delivery date below. Pre-orders check out on their own —
          they cannot share a basket with in-stock items.
        </p>

        {form.preorder && (
          <Field label="Delivery from">
            <Input
              type="date"
              value={form.preorderShipsAt}
              onChange={(e) => set('preorderShipsAt', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Shown on the card as “Delivery from …”, and snapshotted onto each
              booking — moving it later never rewrites what an existing
              customer was promised.
            </p>
          </Field>
        )}
      </div>

      <Field label="Colors (English|Bangla|#hex, comma separated)">
        <Input
          value={form.colors}
          onChange={(e) => set('colors', e.target.value)}
          placeholder="Black|কালো|#111827, Print|প্রিন্ট"
        />
        <p className="text-xs text-muted-foreground">
          The hex is optional. Give every colour one and they render as swatches;
          leave any off and all of them show as text pills instead — a row mixing
          circles and pills reads as broken.
        </p>
      </Field>

      <Field label="Highlights (one per line, English|Bangla)">
        <Textarea
          rows={4}
          value={form.highlights}
          onChange={(e) => set('highlights', e.target.value)}
          placeholder={'100% Cotton|১০০% কটন\nBreathable|শ্বাস-প্রশ্বাসযোগ্য'}
        />
        <p className="text-xs text-muted-foreground">
          Short selling points for this specific product, up to 8.
        </p>
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
