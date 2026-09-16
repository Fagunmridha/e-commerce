'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ImageUploader } from '@/components/admin/image-uploader'
import { LoadingOverlay } from '@/components/loading-overlay'
import { useLanguage } from '@/components/language-provider'
import { useCatalogue } from '@/components/catalogue-provider'
import { upsertSellerProduct } from '@/app/actions/seller-products'
import { splitCommission } from '@/lib/commission'
import { discountPercent, formatPrice } from '@/lib/currency'
import { categoriesInLine } from '@/lib/category-tree'
import {
  definitionsForCategory,
  firstMissing,
  toValueMap,
} from '@/lib/attribute-tree'
import { ProductAttributeFields } from '@/components/product-attribute-fields'
import type { AttributeDefinition, AttributeValue } from '@/lib/attribute-tree'
import type { CategorySlug, Product } from '@/lib/types'

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
  sellerLines,
  definitions,
  attributeValues = [],
  gallery = [],
}: {
  product?: Product
  defaultCommissionPct: number
  /** Every admin-defined field in the store; narrowed per category below. */
  definitions: AttributeDefinition[]
  /** This listing's stored answers, on the edit screen. */
  attributeValues?: AttributeValue[]
  /** Extra shots beyond `product.image`, in position order. */
  gallery?: string[]
  /**
   * The trade lines this shop was approved for. Empty for a shop approved
   * before lines existed — those keep the full list until an admin grants some.
   */
  sellerLines: CategorySlug[]
}) {
  const router = useRouter()
  const { t, pick } = useLanguage()
  const { wholesaleCategories, catalogues } = useCatalogue()
  const copy = t.wholesale.dashboard

  /**
   * The line this product sits in, found from its own category on an edit.
   *
   * Scanned over the shop's granted lines only: a listing filed under a line
   * that has since been revoked has no line to start from, and falls to the
   * first granted one — the server refuses to save it back where it was, which
   * is the point of revoking.
   */
  const initialLine =
    (product &&
      sellerLines.find((line) =>
        categoriesInLine(wholesaleCategories, line).some(
          (category) => category.slug === product.category,
        ),
      )) ??
    sellerLines[0] ??
    ''

  const [pending, setPending] = useState(false)

  // Kept outside the main form object, matching the admin form: it's a
  // growable list whose rows are uploaders with their own progress state.
  const [shots, setShots] = useState<string[]>(gallery)

  const [form, setForm] = useState({
    // The seller types one name, so the English side is the one to read back.
    name: product?.name.en ?? '',
    tradeLine: initialLine,
    price: product?.price?.toString() ?? '',
    // Stored as `oldPrice`; for a marketplace listing that is the MRP.
    mrp: product?.oldPrice?.toString() ?? '',
    image: product?.image ?? '',
    category: product?.category ?? '',
    catalogue: product?.catalogue ?? '',
    stock: product?.stock?.toString() ?? '',
    // `moq` is undefined on the type when it is 1 (see lib/products.ts), and the
    // field should read "1" rather than blank.
    moq: (product?.moq ?? 1).toString(),
    sizes: product?.sizes?.join(', ') ?? '',
    colors: product?.colors?.map((colour) => colour.name.en).join(', ') ?? '',
    description: product?.description?.en ?? '',
  })

  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }))

  /**
   * Step two's options: the categories of the line picked in step one. The
   * same `categoriesInLine` the server action checks against, so the form can
   * only ever offer a path the server will accept.
   */
  const lineCategories = categoriesInLine(wholesaleCategories, form.tradeLine)

  /**
   * A category the admin has switched off drops out of the list above, but a
   * listing already filed there may keep it — the server allows that on an
   * edit. Carried as its own option so the value stays visible instead of the
   * select silently showing the first row while holding another.
   */
  const keptCategory =
    product && form.category === product.category &&
    !lineCategories.some((category) => category.slug === form.category)
  const category = lineCategories.some((c) => c.slug === form.category) || keptCategory
    ? form.category
    : (lineCategories[0]?.slug ?? '')

  const lineCatalogues = catalogues.filter(
    (item) => item.categorySlug === category,
  )
  const keptCatalogue =
    product && form.catalogue && form.catalogue === product.catalogue &&
    !lineCatalogues.some((item) => item.slug === form.catalogue)

  const chooseLine = (slug: string) =>
    setForm((current) => ({
      ...current,
      tradeLine: slug,
      // Both lower levels belonged to the line being left.
      category: categoriesInLine(wholesaleCategories, slug)[0]?.slug ?? '',
      catalogue: '',
    }))

  const lineName = (slug: string) => {
    const line = wholesaleCategories.find((entry) => entry.slug === slug)
    return line ? pick(line.name) : slug
  }

  /** Draft is offered only where it means something: a listing not yet live. */
  const canDraft =
    !product ||
    product.approvalStatus === 'draft' ||
    product.approvalStatus === 'rejected'

  /**
   * The admin-defined fields for the category currently picked, and this
   * listing's answers to them.
   *
   * The answers are keyed by definition id and kept across a category change on
   * purpose: moving a shirt from Men's to Women's should not throw away its
   * fabric, and `attributeWrites` drops any answer whose definition no longer
   * applies on the way in — so nothing wrong can be saved either way.
   */
  const fields = definitionsForCategory(
    definitions,
    wholesaleCategories,
    category,
  )
  const [attributes, setAttributes] = useState(() => toValueMap(attributeValues))
  const setAttribute = (definitionId: string, value: string) =>
    setAttributes((current) => ({ ...current, [definitionId]: value }))

  async function save(submit: boolean) {
    if (!form.name.trim() || !form.image.trim() || !form.price.trim()) {
      toast.error(copy.failed, { description: copy.required })
      return
    }

    // A draft may be incomplete — that is what a draft is for. Required
    // product fields are enforced only on the way into review.
    const missing = submit ? firstMissing(fields, attributes) : null
    if (missing) {
      toast.error(copy.failed, { description: pick(missing.label) })
      return
    }

    setPending(true)
    const result = await upsertSellerProduct({
      id: product?.id ?? null,
      name: form.name.trim(),
      image: form.image.trim(),
      gallery: shots.map((url) => url.trim()).filter(Boolean),
      tradeLine: form.tradeLine,
      category,
      catalogue: form.catalogue || null,
      price: Number(form.price) || 0,
      mrp: form.mrp.trim() ? Number(form.mrp) : null,
      colors: form.colors
        ? form.colors.split(',').map((colour) => colour.trim()).filter(Boolean)
        : null,
      submit,
      stock: Number(form.stock) || 0,
      moq: Number(form.moq) || 1,
      sizes: form.sizes
        ? form.sizes.split(',').map((size) => size.trim()).filter(Boolean)
        : null,
      description: form.description.trim() || null,
      attributes: Object.entries(attributes).map(([definitionId, value]) => ({
        definitionId,
        value,
      })),
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

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    await save(true)
  }

  // No granted line means nowhere to list. Saying so beats a form whose every
  // save the server would refuse.
  if (sellerLines.length === 0) {
    return (
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>{copy.noLinesTitle}</CardTitle>
          <CardDescription>{copy.noLinesBody}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      <LoadingOverlay show={pending} label={copy.saving} />
      
      {/* Where the listing goes, as the three steps it is: line, category,
          catalogue. Each select offers only what the one before it allows, and
          a level with a single possible answer is stated rather than offered —
          a select holding one option reads as a list that failed to load. */}
      <Card>
        <CardHeader>
          <CardTitle>{copy.whereTitle}</CardTitle>
          <CardDescription>{copy.whereHint}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-3">
          <Field label={`1. ${copy.tradeLine}`} hint={copy.tradeLineHint}>
            {sellerLines.length === 1 ? (
              <p className="flex h-9 items-center text-sm font-medium text-foreground">
                {lineName(sellerLines[0])}
              </p>
            ) : (
              <select
                value={form.tradeLine}
                onChange={(event) => chooseLine(event.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {sellerLines.map((slug) => (
                  <option key={slug} value={slug}>
                    {lineName(slug)}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field label={`2. ${copy.category}`}>
            {lineCategories.length === 1 && !keptCategory ? (
              <p className="flex h-9 items-center text-sm font-medium text-foreground">
                {pick(lineCategories[0].name)}
              </p>
            ) : (
              <select
                value={category}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category: event.target.value,
                    // The catalogue belonged to the category being left.
                    catalogue: '',
                  }))
                }
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {keptCategory && (
                  <option value={form.category}>{form.category}</option>
                )}
                {lineCategories.map((entry) => (
                  <option key={entry.slug} value={entry.slug}>
                    {pick(entry.name)}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field label={`3. ${t.catalogue.catalogue}`}>
            <select
              value={form.catalogue}
              onChange={(event) => set('catalogue', event.target.value)}
              disabled={lineCatalogues.length === 0 && !keptCatalogue}
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
            >
              <option value="">{t.catalogue.allCatalogues}</option>
              {keptCatalogue && (
                <option value={form.catalogue}>{form.catalogue}</option>
              )}
              {lineCatalogues.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {pick(item.name)}
                </option>
              ))}
            </select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Basic Details</CardTitle>
          <CardDescription>
            Provide the name and category for your wholesale listing.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <Field label={copy.name}>
            <Input
              value={form.name}
              onChange={(event) => set('name', event.target.value)}
              placeholder={copy.namePlaceholder}
            />
          </Field>
        </CardContent>
      </Card>

      {/* Whatever the admin decided a product in this category must state.
          Its own card rather than more fields in Basic Details: the set
          changes as the category changes, and mixing it into a fixed block
          makes the form look like it lost fields when it did not. */}
      {fields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{copy.specs}</CardTitle>
            <CardDescription>{copy.specsHint}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProductAttributeFields
              definitions={fields}
              values={attributes}
              onChange={setAttribute}
              pick={pick}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pricing & Inventory</CardTitle>
          <CardDescription>
            Set your wholesale price, available stock, and minimum order quantity.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <Field label={copy.price} hint={copy.priceHint}>
            <div className="space-y-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">৳</span>
                <Input
                  type="number"
                  step="1"
                  min={0}
                  className="pl-8 font-semibold"
                  value={form.price}
                  onChange={(event) => set('price', event.target.value)}
                />
              </div>
              {(() => {
                const p = Number(form.price) || 0
                if (p > 0) {
                  const pct = product?.commissionPct ?? defaultCommissionPct
                  const { payout, commission } = splitCommission(p, pct)
                  return (
                    <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-sm shadow-sm space-y-1.5">
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Platform fee ({pct}%)</span>
                        <span>{formatPrice(commission)}</span>
                      </div>
                      <div className="h-px bg-border/50 w-full" />
                      <div className="flex justify-between items-center font-semibold text-foreground">
                        <span>You receive</span>
                        <span className="text-emerald-600 dark:text-emerald-500">{formatPrice(payout)}</span>
                      </div>
                    </div>
                  )
                }
                return null
              })()}
            </div>
          </Field>
          <Field label={copy.mrp} hint={copy.mrpHint}>
            <div className="space-y-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-muted-foreground">
                  ৳
                </span>
                <Input
                  type="number"
                  step="1"
                  min={0}
                  className="pl-8"
                  value={form.mrp}
                  onChange={(event) => set('mrp', event.target.value)}
                />
              </div>
              {/* The same arithmetic the card will print, shown before saving
                  so a typo'd MRP is caught here rather than on the market. */}
              {discountPercent(Number(form.price) || 0, Number(form.mrp) || 0) >
                0 && (
                <p className="text-xs font-medium text-emerald-700">
                  {copy.belowMrp.replace(
                    '{n}',
                    String(
                      discountPercent(Number(form.price) || 0, Number(form.mrp) || 0),
                    ),
                  )}
                </p>
              )}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Media</CardTitle>
          <CardDescription>Upload a clear, high-quality image of the product.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ImageUploader
            value={form.image}
            onChange={(url) => set('image', url)}
            folder="wholesale-products"
            label={copy.image}
          />

          <div className="space-y-3">
            <Label>Gallery</Label>
            <p className="text-xs text-muted-foreground">
              Extra shots of this product, shown as thumbnails after the
              primary image. Leave empty and the product page shows a single
              photo with no thumbnail strip.
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
                    folder="wholesale-products"
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
            {shots.length < 4 && (
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
          <CardDescription>Provide sizes and a detailed description.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Field label={copy.sizes} hint={copy.sizesHint}>
            <Input
              value={form.sizes}
              onChange={(event) => set('sizes', event.target.value)}
              placeholder="S, M, L, XL"
            />
          </Field>

          <Field label={copy.colors} hint={copy.colorsHint}>
            <Input
              value={form.colors}
              onChange={(event) => set('colors', event.target.value)}
              placeholder="Black, Navy, Maroon"
            />
          </Field>

          <Field label={copy.description} hint={copy.descriptionHint}>
            <Textarea
              rows={4}
              value={form.description}
              onChange={(event) => set('description', event.target.value)}
              className="resize-none"
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="min-w-[100px]"
          onClick={() => router.push('/wholesale/dashboard')}
        >
          {copy.cancel}
        </Button>
        {canDraft && (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => save(false)}
          >
            {copy.saveDraft}
          </Button>
        )}
        <Button type="submit" disabled={pending} className="min-w-[140px]">
          {pending ? copy.saving : canDraft ? copy.submitReview : copy.save}
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
