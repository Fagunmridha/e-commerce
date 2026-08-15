'use client'

import { useCallback, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertTriangle,
  BadgeCheck,
  Layers,
  Package,
  Pencil,
  Plus,
  Search,
  Store,
  Trash2,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { useLanguage } from '@/components/language-provider'
import { useCatalogue } from '@/components/catalogue-provider'
import { deleteSellerProduct } from '@/app/actions/seller-products'
import { cn } from '@/lib/utils'
import type { CategorySlug, Product } from '@/lib/types'

/** Pieces left before a listing is flagged as running low. */
const LOW_STOCK = 10

type StockLevel = 'in' | 'low' | 'out'

function stockLevel(stock: number): StockLevel {
  if (stock <= 0) return 'out'
  return stock <= LOW_STOCK ? 'low' : 'in'
}

/** Tint per stock level — the same three colours the stat tiles use. */
const STOCK_TONE: Record<StockLevel, string> = {
  in: 'border-transparent bg-emerald-500/12 text-emerald-700',
  low: 'border-transparent bg-amber-500/12 text-amber-700',
  out: 'border-transparent bg-rose-500/12 text-rose-700',
}

const STOCK_DOT: Record<StockLevel, string> = {
  in: 'bg-emerald-500',
  low: 'bg-amber-500',
  out: 'bg-rose-500',
}

/**
 * An approved shop's own listings.
 *
 * Only approved shops get here — the route group's layout redirects everyone
 * else — so there is no paused or pending state to render.
 */
export function SellerDashboard({
  shopName,
  products,
}: {
  shopName: string
  products: Product[]
}) {
  const { t, pick, price } = useLanguage()
  const { getCategory } = useCatalogue()
  const router = useRouter()
  const copy = t.wholesale.dashboard

  const [removing, setRemoving] = useState<string | null>(null)
  /** The listing the confirm dialog is asking about, if any. */
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  const totalStock = products.reduce((sum, product) => sum + product.stock, 0)
  const outOfStock = products.filter((product) => product.stock <= 0).length
  const stockValue = products.reduce(
    (sum, product) => sum + product.price * product.stock,
    0,
  )

  /**
   * A category the admin added later has no dictionary entry, so fall back to
   * the slug rather than rendering nothing.
   */
  const categoryLabel = useCallback(
    (slug: CategorySlug) => {
      const found = getCategory(slug)
      return found ? pick(found.name) : slug
    },
    [getCategory, pick],
  )

  /** Only offer categories the shop actually has listings in. */
  const usedCategories = useMemo(() => {
    const slugs = [...new Set(products.map((product) => product.category))]
    return slugs.map((slug) => ({ slug, label: categoryLabel(slug) }))
  }, [products, categoryLabel])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return products.filter(
      (product) =>
        (!category || product.category === category) &&
        (!term || pick(product.name).toLowerCase().includes(term)),
    )
  }, [products, search, category, pick])

  async function onRemove(product: Product) {
    setPendingDelete(null)
    setRemoving(product.id)
    const result = await deleteSellerProduct(product.id)
    setRemoving(null)

    if (!result.ok) {
      toast.error(copy.failed, { description: result.error })
      return
    }

    toast.success(copy.removed)
    router.refresh()
  }

  return (
    <>
      {/* The sidebar carries the shop's identity, so this is just the page
          title and the actions that belong to it. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-bold tracking-tight text-foreground">
              {shopName}
            </h1>
            <Badge
              variant="secondary"
              className="border-0 bg-emerald-500/12 text-emerald-700"
            >
              <BadgeCheck className="size-3" aria-hidden="true" />
              {copy.approvedBadge}
            </Badge>
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {copy.totalProducts}: {products.length} · {copy.totalStock}:{' '}
            {totalStock}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/wholesale/market">
            <Store className="size-4" aria-hidden="true" />
            {copy.marketCta}
          </Link>
        </Button>
      </div>

      {products.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label={copy.totalProducts}
            value={String(products.length)}
            icon={Package}
            tone="violet"
          />
          <StatTile
            label={copy.totalStock}
            value={String(totalStock)}
            icon={Layers}
            tone="sky"
          />
          <StatTile
            label={copy.outOfStockStat}
            value={String(outOfStock)}
            icon={AlertTriangle}
            tone={outOfStock > 0 ? 'rose' : 'emerald'}
          />
          <StatTile
            label={copy.stockValue}
            value={price(stockValue)}
            hint={copy.stockValueHint}
            icon={Wallet}
            tone="emerald"
          />
        </div>
      )}

      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">
            {copy.myProducts}
            {products.length > 0 && (
              <span className="ml-2 text-muted-foreground">
                ({visible.length})
              </span>
            )}
          </h3>

          {products.length > 0 && (
            <div className="flex flex-1 flex-wrap justify-end gap-2 sm:flex-none">
              <div className="relative min-w-48 flex-1 sm:max-w-64">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={copy.searchPlaceholder}
                  className="h-9 pl-9"
                  aria-label={copy.searchPlaceholder}
                />
              </div>
              {usedCategories.length > 1 && (
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  aria-label={copy.allCategories}
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="">{copy.allCategories}</option>
                  {usedCategories.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {products.length === 0 ? (
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Package className="size-5" aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
              <EmptyDescription>{copy.emptyBody}</EmptyDescription>
            </EmptyHeader>
            <Button asChild size="sm" className="mt-2">
              <Link href="/wholesale/dashboard/products/new">
                <Plus className="size-4" aria-hidden="true" />
                {copy.addProduct}
              </Link>
            </Button>
          </Empty>
        ) : visible.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm text-muted-foreground">{copy.noResults}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearch('')
                setCategory('')
              }}
            >
              {copy.clearFilters}
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop: a proper table. */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <tr>
                    <th className="px-5 py-3 font-medium">{copy.colProduct}</th>
                    <th className="px-4 py-3 font-medium">
                      {copy.colCategory}
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      {copy.colPrice}
                    </th>
                    <th className="px-4 py-3 font-medium">{copy.colStock}</th>
                    <th className="px-4 py-3 text-right font-medium">
                      {copy.colMoq}
                    </th>
                    <th className="px-5 py-3 text-right font-medium">
                      {copy.colActions}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((product) => (
                    <tr
                      key={product.id}
                      className={cn(
                        'border-t border-border transition-colors hover:bg-muted/40',
                        removing === product.id && 'opacity-50',
                      )}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Image
                            src={product.image}
                            alt=""
                            width={44}
                            height={44}
                            className="size-11 shrink-0 rounded-lg border border-border object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              {pick(product.name)}
                            </p>
                            {product.sizes && product.sizes.length > 0 && (
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {product.sizes.join(' · ')}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-normal">
                          {categoryLabel(product.category)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">
                        {price(product.price)}
                      </td>
                      <td className="px-4 py-3">
                        <StockBadge stock={product.stock} copy={copy} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {product.moq ?? 1}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            asChild
                            variant="outline"
                            size="icon-sm"
                            title={copy.edit}
                          >
                            <Link
                              href={`/wholesale/dashboard/products/${product.id}`}
                            >
                              <Pencil className="size-4" aria-hidden="true" />
                              <span className="sr-only">{copy.edit}</span>
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title={copy.remove}
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            disabled={removing === product.id}
                            onClick={() => setPendingDelete(product)}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                            <span className="sr-only">{copy.remove}</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: the same rows as cards, so nothing needs sideways scrolling. */}
            <ul className="divide-y divide-border md:hidden">
              {visible.map((product) => (
                <li
                  key={product.id}
                  className={cn('p-4', removing === product.id && 'opacity-50')}
                >
                  <div className="flex gap-3">
                    <Image
                      src={product.image}
                      alt=""
                      width={56}
                      height={56}
                      className="size-14 shrink-0 rounded-lg border border-border object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {pick(product.name)}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground">
                        {price(product.price)}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {copy.colMoq}: {product.moq ?? 1}
                        </span>
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StockBadge stock={product.stock} copy={copy} />
                        <Badge variant="outline" className="font-normal">
                          {categoryLabel(product.category)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Link
                        href={`/wholesale/dashboard/products/${product.id}`}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                        {copy.edit}
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={removing === product.id}
                      onClick={() => setPendingDelete(product)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      {removing === product.id ? copy.removing : copy.remove}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.removeTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? `“${pick(pendingDelete.name)}” — ` : ''}
              {copy.removeConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => pendingDelete && onRemove(pendingDelete)}
            >
              {copy.remove}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/** Stock count with its status colour — the one signal a seller scans for. */
function StockBadge({
  stock,
  copy,
}: {
  stock: number
  copy: {
    statusInStock: string
    statusLow: string
    statusOut: string
    pieces: string
  }
}) {
  const level = stockLevel(stock)
  const label =
    level === 'out'
      ? copy.statusOut
      : level === 'low'
        ? copy.statusLow
        : copy.statusInStock

  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium',
        STOCK_TONE[level],
      )}
      title={label}
    >
      <span
        className={cn('size-1.5 rounded-full', STOCK_DOT[level])}
        aria-hidden="true"
      />
      {level === 'out' ? label : copy.pieces.replace('{n}', String(stock))}
    </span>
  )
}

const TILE_TONE = {
  violet: 'bg-violet-500/12 text-violet-600',
  sky: 'bg-sky-500/12 text-sky-600',
  emerald: 'bg-emerald-500/12 text-emerald-600',
  rose: 'bg-rose-500/12 text-rose-600',
}

function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  tone: keyof typeof TILE_TONE
}) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight tabular-nums text-foreground">
            {value}
          </p>
          {hint && (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {hint}
            </p>
          )}
        </div>
        <span
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-lg',
            TILE_TONE[tone],
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  )
}
