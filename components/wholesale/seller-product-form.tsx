'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
import { formatPrice } from '@/lib/currency'
import { categoriesInLine, categoriesInLines } from '@/lib/category-tree'
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
}: {
  product?: Product
  defaultCommissionPct: number
  /** Every admin-defined field in the store; narrowed per category below. */
  definitions: AttributeDefinition[]
  /** This listing's stored answers, on the edit screen. */
  attributeValues?: AttributeValue[]
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

  // Where this shop may file a listing, across every line it was approved for.
  // A line with no sub-categories is its own only destination, which
  // `categoriesInLines` already answers — see lib/category-tree.ts, the same
  // module the server action checks against.
  const categories =
    sellerLines.length > 0
      ? categoriesInLines(wholesaleCategories, sellerLines)
      : wholesaleCategories

  /**
   * The same list, split by trade line, for a shop approved for more than one.
   *
   * An `<optgroup>` rather than a second "pick a line" select above this one:
   * it puts the line in front of the seller — the thing requirement-17 calls
   * step 1 — without a second piece of state that can disagree with the first,
   * and without changing the shape of the form for the ordinary one-line shop.
   *
   * A childless line is its own category, so it labels its own group.
   */
  const grouped = sellerLines.map((slug) => {
    const line = wholesaleCategories.find((category) => category.slug === slug)
    return {
      slug,
      label: line ? pick(line.name) : slug,
      categories: categoriesInLine(wholesaleCategories, slug),
    }
  })

  const [pending, setPending] = useState(false)

  const [form, setForm] = useState({
    // The seller types one name, so the English side is the one to read back.
    name: product?.name.en ?? '',
    price: product?.price?.toString() ?? '',
    image: product?.image ?? '',
    // The shop's line wins over the product's own category, so a listing
    // filed before the line was set corrects itself the next time it is saved.
    category:
      product?.category && categories.some((c) => c.slug === product.category)
        ? product.category
        : (categories[0]?.slug ?? ''),
    catalogue: product?.catalogue ?? '',
    stock: product?.stock?.toString() ?? '',
    // `moq` is undefined on the type when it is 1 (see lib/products.ts), and the
    // field should read "1" rather than blank.
    moq: (product?.moq ?? 1).toString(),
    sizes: product?.sizes?.join(', ') ?? '',
    description: product?.description?.en ?? '',
  })

  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }))

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
    form.category,
  )
  const [attributes, setAttributes] = useState(() => toValueMap(attributeValues))
  const setAttribute = (definitionId: string, value: string) =>
    setAttributes((current) => ({ ...current, [definitionId]: value }))

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!form.name.trim() || !form.image.trim() || !form.price.trim()) {
      toast.error(copy.failed, { description: copy.required })
      return
    }

    const missing = firstMissing(fields, attributes)
    if (missing) {
      toast.error(copy.failed, { description: pick(missing.label) })
      return
    }

    setPending(true)
    const result = await upsertSellerProduct({
      id: product?.id ?? null,
      name: form.name.trim(),
      image: form.image.trim(),
      category: form.category,
      catalogue: form.catalogue || null,
      price: Number(form.price) || 0,
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

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      <LoadingOverlay show={pending} label={copy.saving} />
      
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
          {/* A line with one destination is stated, not offered: a select
              holding a single disabled option reads as a list that failed to
              load rather than as a decision already made. */}
          {categories.length === 1 ? (
            <Field label={copy.category}>
              <p className="flex h-9 items-center text-sm text-foreground">
                {pick(categories[0].name)}
              </p>
              <p className="text-xs text-muted-foreground">
                {copy.categoryLocked}
              </p>
            </Field>
          ) : (
            <Field label={copy.category}>
              <select
                value={form.category}
                onChange={(event) => {
                  set('category', event.target.value)
                  // The catalogue belongs to the category being left behind.
                  // The server drops a mismatched pair to null; clearing it
                  // here means the seller sees that rather than finding out
                  // on save.
                  set('catalogue', '')
                }}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {grouped.length > 1
                  ? grouped.map((group) => (
                      <optgroup key={group.slug} label={group.label}>
                        {group.categories.map((category) => (
                          <option key={category.slug} value={category.slug}>
                            {pick(category.name)}
                          </option>
                        ))}
                      </optgroup>
                    ))
                  : categories.map((category) => (
                      <option key={category.slug} value={category.slug}>
                        {pick(category.name)}
                      </option>
                    ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {sellerLines.length > 0 ? copy.categoryLine : copy.categoryUnset}
              </p>
            </Field>
          )}
          {/* Hidden when the picked category has no catalogues — an empty
              dropdown is a question with no answers. */}
          {catalogues.some((item) => item.categorySlug === form.category) && (
            <Field label={t.catalogue.catalogue}>
              <select
                value={form.catalogue}
                onChange={(event) => set('catalogue', event.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="">{t.catalogue.allCatalogues}</option>
                {catalogues
                  .filter((item) => item.categorySlug === form.category)
                  .map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {pick(item.name)}
                    </option>
                  ))}
              </select>
            </Field>
          )}
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
        <CardContent className="grid gap-6 sm:grid-cols-3">
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
        <CardContent>
          <ImageUploader
            value={form.image}
            onChange={(url) => set('image', url)}
            folder="wholesale-products"
            label={copy.image}
          />
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
        <Button type="submit" disabled={pending} className="min-w-[140px]">
          {pending ? copy.saving : copy.save}
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
