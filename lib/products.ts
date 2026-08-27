import 'server-only'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { and, asc, desc, eq, ilike, isNull, ne, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getViewerWholesaleRole } from '@/lib/wholesalers'
import {
  catalogues,
  categories,
  orderItems,
  orders,
  productImages,
  products,
  reviews,
  wholesalerApplications,
  type ProductRow,
  type ReviewRow,
} from '@/lib/db/schema'
import type { Localized } from '@/lib/i18n'
import type {
  Catalogue,
  Category,
  CategorySlug,
  Product,
  ProductColor,
  Review,
  ReviewStatus,
} from '@/lib/types'

type Aggregate = { avg: number; count: number }

/** What the detail page needs, fetched together. See `loadProductDetail`. */
export type ProductDetail = {
  product?: Product
  images: string[]
  /** Approved only — `reviews` is what the public sees. */
  reviews: Review[]
  /**
   * The signed-in viewer's own review while it is still unapproved. Shown back
   * to them alone, so submitting does not look like it silently failed.
   */
  viewerReview?: Review & { status: ReviewStatus }
}

const EMPTY_DETAIL: ProductDetail = { product: undefined, images: [], reviews: [] }

/**
 * productId → { average rating, review count } for the whole catalogue.
 *
 * Approved reviews only. This one filter covers every star rating in the app —
 * /shop, the category pages, the home rails, search, the wholesale market and
 * the admin product table all price their rating through here — so a pending
 * or rejected review can never move a number a shopper sees.
 */
async function reviewAggregates(): Promise<Map<string, Aggregate>> {
  const rows = await db
    .select({
      productId: reviews.productId,
      avg: sql<string>`avg(${reviews.rating})`,
      count: sql<string>`count(*)`,
    })
    .from(reviews)
    .where(eq(reviews.status, 'approved'))
    .groupBy(reviews.productId)

  const map = new Map<string, Aggregate>()
  for (const row of rows) {
    map.set(row.productId, {
      avg: Math.round(Number(row.avg) * 10) / 10,
      count: Number(row.count),
    })
  }
  return map
}

/**
 * `colors` was `Localized[]` until migration 0012 reshaped it to
 * `{ name, hex? }[]`. `$type<>` is a compile-time assertion only, so at runtime
 * this can still be the old shape: a database the migration has not been run
 * against, or a dev copy built with `db:push` (which diffs DDL and so finds
 * nothing to do here). Normalising on read means every consumer sees exactly
 * one shape and the migration is cleanup rather than a deploy dependency.
 */
function toColors(value: unknown): ProductColor[] | undefined {
  if (!Array.isArray(value)) return undefined

  const colors = value.flatMap<ProductColor>((item) => {
    if (!item || typeof item !== 'object') return []
    if ('name' in item) return [item as ProductColor]

    const legacy = item as Localized
    return legacy.en ? [{ name: legacy }] : []
  })

  // Collapse [] to undefined, which is what every consumer already guards for.
  return colors.length ? colors : undefined
}

function toProduct(
  row: ProductRow,
  agg?: Aggregate,
  sellerName?: string,
  sold?: number,
  preorderBooked?: number,
): Product {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    oldPrice: row.oldPrice ?? undefined,
    image: row.image,
    category: row.category,
    catalogue: row.catalogueSlug ?? undefined,
    badge: row.badge ?? undefined,
    sizes: row.sizes ?? undefined,
    colors: toColors(row.colors),
    highlights: row.highlights?.length ? row.highlights : undefined,
    description: row.description ?? undefined,
    stock: row.stock,
    // 1 is "no minimum", which every house product has — left undefined so the
    // UI can test for the badge with a plain truthiness check.
    moq: row.moq > 1 ? row.moq : undefined,
    rating: agg?.avg ?? 0,
    reviews: agg?.count ?? 0,
    sold: sold || undefined,
    sellerId: row.sellerId ?? undefined,
    sellerName,
    // Null means "use the store default", exactly as for the advance below. A
    // stored 0 — a shop carried at cost — is a real choice and must survive.
    commissionPct: row.commissionPct ?? undefined,
    // False is the overwhelming majority, so it is left undefined rather than
    // shipped on every row — consumers test it for truthiness either way.
    preorder: row.preorder || undefined,
    preorderShipsAt: row.preorderShipsAt ?? undefined,
    preorderBooked,
    // Null means "use the store default", which is what `undefined` signals to
    // `advancePct()`. A stored 0 is a real choice and must survive.
    preorderAdvancePct: row.preorderAdvancePct ?? undefined,
  }
}

/**
 * The store's own catalogue. Marketplace listings are excluded so /shop, the
 * category pages and the homepage rails keep showing only what the store
 * itself sells — sellers' stock lives in the wholesale section.
 */
async function fetchAllProducts(): Promise<Product[]> {
  const [rows, aggregates] = await Promise.all([
    db
      .select()
      .from(products)
      .where(isNull(products.sellerId))
      .orderBy(asc(products.createdAt), asc(products.id)),
    reviewAggregates(),
  ])
  return rows.map((row) => toProduct(row, aggregates.get(row.id)))
}

// The whole catalogue is fetched on every page (root layout). Cache it so a
// navigation no longer pays a round-trip to the database — admin edits bust
// the `catalogue` tag (see app/actions/admin.ts), so the store stays live.
//
// The `-v2` suffix retires entries written before the `colors` reshape. A cache
// hit never runs `toProduct`, so `toColors` would not get the chance to
// normalise them and the old shape would be served straight through.
export const getAllProducts = unstable_cache(fetchAllProducts, ['all-products-v2'], {
  tags: ['catalogue'],
  revalidate: 60,
})

/**
 * Everything listed by approved wholesalers, newest first.
 *
 * The join is the visibility gate, not decoration — drop it and a suspended
 * shop's stock reappears in the market. The shop *name* is deliberately not
 * selected: this feeds the client `CatalogueProvider`, so anything on these
 * rows is serialised into the buyer's page, and the buyer must not learn which
 * wholesaler supplied what.
 */
async function fetchWholesaleProducts(): Promise<Product[]> {
  const [rows, aggregates] = await Promise.all([
    db
      .select({ product: products })
      .from(products)
      .innerJoin(
        wholesalerApplications,
        eq(products.sellerId, wholesalerApplications.id),
      )
      .where(eq(wholesalerApplications.status, 'approved'))
      .orderBy(desc(products.createdAt), asc(products.id)),
    reviewAggregates(),
  ])

  return rows.map((row) =>
    toProduct(row.product, aggregates.get(row.product.id)),
  )
}

// `-v3` retires entries written while this query still selected the shop name.
// A cache hit never runs `fetchWholesaleProducts`, so without the bump the old
// rows — `sellerName` and all — would be served straight through to buyers.
export const getWholesaleProducts = unstable_cache(
  fetchWholesaleProducts,
  ['wholesale-products-v3'],
  { tags: ['catalogue'], revalidate: 60 },
)

/**
 * Everything the store holds, house stock and marketplace listings alike.
 * Only the admin product screens use this — the storefront deliberately keeps
 * the two apart, but an admin managing stock needs to see the lot. Uncached:
 * the admin should never be looking at a stale table.
 */
export async function getAdminProducts(): Promise<Product[]> {
  const [rows, aggregates] = await Promise.all([
    db
      .select({ product: products, shopName: wholesalerApplications.shopName })
      .from(products)
      .leftJoin(
        wholesalerApplications,
        eq(products.sellerId, wholesalerApplications.id),
      )
      .orderBy(asc(products.createdAt), asc(products.id)),
    reviewAggregates(),
  ])

  return rows.map((row) =>
    toProduct(
      row.product,
      aggregates.get(row.product.id),
      row.shopName ?? undefined,
    ),
  )
}

/**
 * Pieces sold, for the "256 sold" line on the detail page.
 *
 * Derived rather than stored: `order_items` already holds every sale. Cancelled
 * orders are excluded, so the number goes back down when an order is cancelled
 * — which is the honest behaviour and the reason for the join.
 *
 * Called only from the single-product paths. Adding this GROUP BY to every
 * catalogue query would cost a scan on every page for a number no card shows.
 */
async function soldCount(id: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<string>`coalesce(sum(${orderItems.quantity}), 0)` })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(orderItems.productId, id), ne(orders.status, 'cancelled')))

  return Number(row?.n ?? 0)
}

/** One product's rating, for the paths that fetch a single row. */
async function reviewAggregate(id: string): Promise<Aggregate | undefined> {
  const [agg] = await db
    .select({
      avg: sql<string>`avg(${reviews.rating})`,
      count: sql<string>`count(*)`,
    })
    .from(reviews)
    .where(and(eq(reviews.productId, id), eq(reviews.status, 'approved')))

  return agg && Number(agg.count) > 0
    ? { avg: Math.round(Number(agg.avg) * 10) / 10, count: Number(agg.count) }
    : undefined
}

/**
 * Finds house *and* marketplace products — the detail page serves both. The
 * marketplace half is gated: a listing is only returned when its shop is still
 * approved *and* the viewer is an approved wholesaler themselves. Without that
 * second half `/product/w-something` would be a way around the hidden market,
 * and a suspended shop's stock would stay buyable through a stale link.
 *
 * The viewer is resolved here rather than passed in so a new caller cannot
 * forget the check. Admin screens use `getAdminProductById` instead.
 */
export const getProductById = cache(async function getProductById(
  id: string,
): Promise<Product | undefined> {
  const { product } = await loadProductDetail(id)
  return product
})

/**
 * Everything the detail page renders, in **one** database round trip.
 *
 * The queries here are independent, so they used to run as four or five
 * separate `await`s spread across this module and the page. Over Neon's HTTP
 * driver each of those is its own request — measured at ~340ms from Dhaka to
 * the us-east-2 instance, and 1.7s when the endpoint has gone cold — so the
 * page was paying for latency, not for work: the whole catalogue is 16 rows.
 * `db.batch` sends the lot as a single request. (Neon HTTP has no interactive
 * transactions; batch is the supported way to group statements.)
 *
 * The gallery, review list and aggregates all come back together, which is why
 * the page calls this instead of `getProductById` + `getProductImages`.
 *
 * This is the one loader in the module whose result depends on *who* is asking:
 * the last statement fetches the signed-in viewer's own unapproved review so
 * they can see that their submission landed. That is safe only because the
 * wrapper below is React `cache()` — request-scoped — and not `unstable_cache`.
 * If this ever gains a cross-request cache, `viewerReview` has to come out.
 */
async function loadProductDetail(
  id: string,
  viewerId?: number,
): Promise<ProductDetail> {
  const [[row], [agg], [sold], [booked], imageRows, reviewRows, viewerRows] =
    await db.batch([
    db.select().from(products).where(eq(products.id, id)),
    db
      .select({
        avg: sql<string>`avg(${reviews.rating})`,
        count: sql<string>`count(*)`,
      })
      .from(reviews)
      .where(and(eq(reviews.productId, id), eq(reviews.status, 'approved'))),
    db
      .select({ n: sql<string>`coalesce(sum(${orderItems.quantity}), 0)` })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(eq(orderItems.productId, id), ne(orders.status, 'cancelled'))),
    // Bookings, which are *not* the same as `sold`: a product toggled from
    // shelf stock to pre-order would otherwise count its old sales as
    // bookings. Scoped to lines that carry a promised ship date, exactly as
    // `preorderBookedCounts` does. Free — it rides a batch already in flight.
    db
      .select({ n: sql<string>`coalesce(sum(${orderItems.quantity}), 0)` })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orderItems.productId, id),
          sql`${orderItems.preorderShipsAt} is not null`,
          ne(orders.status, 'cancelled'),
        ),
      ),
    db
      .select({ url: productImages.url })
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(asc(productImages.position)),
    db
      .select()
      .from(reviews)
      .where(and(eq(reviews.productId, id), eq(reviews.status, 'approved')))
      .orderBy(desc(reviews.createdAt)),
    // The viewer's own review while it is still waiting on a moderator. Without
    // it, submitting a review makes it vanish, which reads as a failure and
    // produces resubmissions. Rides the batch, so it costs no round trip; the
    // impossible `user_id = -1` is how a signed-out viewer gets a cheap empty
    // result without branching the batch array.
    db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.productId, id),
          eq(reviews.userId, viewerId ?? -1),
          ne(reviews.status, 'approved'),
        ),
      )
      .orderBy(desc(reviews.createdAt))
      .limit(1),
  ])

  if (!row) return EMPTY_DETAIL

  const aggregate =
    agg && Number(agg.count) > 0
      ? {
          avg: Math.round(Number(agg.avg) * 10) / 10,
          count: Number(agg.count),
        }
      : undefined
  // A marketplace listing is only visible when its shop is still approved *and*
  // the viewer is an approved wholesaler — see the note on the gate below. The
  // shop's *name* is deliberately not carried through: the buyer trades with
  // the store, not with whoever supplied the goods.
  if (row.sellerId && !(await sellerIsVisible(row.sellerId))) {
    return EMPTY_DETAIL
  }

  return {
    product: toProduct(
      row,
      aggregate,
      undefined,
      Number(sold?.n ?? 0),
      Number(booked?.n ?? 0),
    ),
    images: [row.image, ...imageRows.map((image) => image.url)],
    reviews: reviewRows.map(toReview),
    viewerReview: viewerRows[0]
      ? { ...toReview(viewerRows[0]), status: viewerRows[0].status }
      : undefined,
  }
}

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    productId: row.productId,
    authorName: row.authorName,
    rating: row.rating,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  }
}

/**
 * The marketplace gate: a listing resolves only when the shop is approved and
 * the viewer joined the programme as a *buyer*. Without the second half
 * `/product/w-something` would be a way around the locked market wall, and a
 * suspended shop's stock would stay buyable through a stale link.
 *
 * The second half used to be "the viewer has an approved shop", back when a
 * wholesaler both bought and sold here. It is the buyer role now, which also
 * closes the door on a seller reaching a listing's Add to Cart by URL — the
 * two sides are exclusive, and the product page is the last place that rule
 * could have been sidestepped without a hand-made request.
 *
 * A boolean, not the shop name it used to return. Answering the gate and
 * handing out the seller's identity were the same call, so every caller got
 * the name whether it needed it or not — and one of them rendered it to the
 * buyer. Two wholesalers either side of a trade must not learn each other
 * exist; only the admin loaders resolve a shop name now.
 */
async function sellerIsVisible(sellerId: string): Promise<boolean> {
  const [shop] = await db
    .select({ status: wholesalerApplications.status })
    .from(wholesalerApplications)
    .where(eq(wholesalerApplications.id, sellerId))

  if (shop?.status !== 'approved') return false
  return (await getViewerWholesaleRole()) === 'buyer'
}

/**
 * Request-scoped so `generateMetadata` and the page body share one fetch.
 * Next calls both for the same render, and without this the whole batch above
 * ran twice.
 *
 * The viewer is resolved here rather than passed in, so callers cannot forget
 * it and cannot ask for someone else's pending review. `getCurrentUser` is
 * itself `cache()`d and already resolved on almost every render.
 */
export const getProductDetail = cache(async function getProductDetail(
  id: string,
): Promise<ProductDetail> {
  const viewer = await getCurrentUser()
  return loadProductDetail(id, viewer?.id)
})

/** Admin edit screen — no seller or approval gate, by design. */
export async function getAdminProductById(
  id: string,
): Promise<Product | undefined> {
  const [row] = await db.select().from(products).where(eq(products.id, id))
  if (!row) return undefined

  const [shop] = row.sellerId
    ? await db
        .select({ shopName: wholesalerApplications.shopName })
        .from(wholesalerApplications)
        .where(eq(wholesalerApplications.id, row.sellerId))
    : []

  return toProduct(row, await reviewAggregate(id), shop?.shopName)
}

/**
 * One of a shop's own listings, for its edit screen. Scoped by `sellerId` so
 * another shop's id resolves to undefined rather than loading their product
 * into a form the seller cannot actually save.
 */
export async function getSellerProductById(
  shopId: string,
  id: string,
): Promise<Product | undefined> {
  const [row] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.sellerId, shopId)))

  return row ? toProduct(row, await reviewAggregate(id)) : undefined
}

/** A single shop's listings, live or hidden — powers the seller dashboard. */
export async function getSellerProducts(shopId: string): Promise<Product[]> {
  const [rows, aggregates] = await Promise.all([
    db
      .select()
      .from(products)
      .where(eq(products.sellerId, shopId))
      .orderBy(desc(products.createdAt), asc(products.id)),
    reviewAggregates(),
  ])
  return rows.map((row) => toProduct(row, aggregates.get(row.id)))
}

/**
 * Category pages show the store's own shelf stock only — pre-orders are
 * excluded here and in `searchProducts` for the same reason they are excluded
 * from the derived helpers below: a Coming Soon row cannot be added to a cart,
 * so listing it beside buyable stock would only offer a button that fails.
 */
export async function getProductsByCategory(
  slug: CategorySlug,
): Promise<Product[]> {
  const [rows, aggregates] = await Promise.all([
    db
      .select()
      .from(products)
      .where(
        and(
          eq(products.category, slug),
          isNull(products.sellerId),
          eq(products.preorder, false),
        ),
      ),
    reviewAggregates(),
  ])
  return rows.map((row) => toProduct(row, aggregates.get(row.id)))
}

/** Homepage "Popular Products" — anything carrying a badge. */
export async function getPopularProducts(limit = 8): Promise<Product[]> {
  const all = await getAllProducts()
  return all
    .filter((product) => product.badge && !product.preorder)
    .slice(0, limit)
}

/** Cart drawer / product page suggestions — anything but the item being viewed. */
export async function getRecommendedProducts(
  excludeId?: string,
  limit = 2,
): Promise<Product[]> {
  const all = await getAllProducts()
  return all
    .filter((product) => product.id !== excludeId && !product.preorder)
    .slice(0, limit)
}

/**
 * Pieces already booked per pre-order product, cancelled orders excluded — the
 * "N pre-orders" line on the Coming Soon card, and the booked column on the
 * admin screen.
 *
 * Derived rather than counted into a column: `order_items` already holds every
 * booking, and deriving is what makes the number go back down when an order is
 * cancelled. `products.stock` moves the other way — it is the allocation that
 * is *left*, decremented atomically as bookings are taken.
 */
async function preorderBookedCounts(): Promise<Map<string, number>> {
  const rows = await db
    .select({
      productId: orderItems.productId,
      booked: sql<string>`sum(${orderItems.quantity})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        sql`${orderItems.preorderShipsAt} is not null`,
        ne(orders.status, 'cancelled'),
      ),
    )
    .groupBy(orderItems.productId)

  const map = new Map<string, number>()
  for (const row of rows) {
    if (row.productId) map.set(row.productId, Number(row.booked))
  }
  return map
}

/**
 * The Coming Soon rail and the admin pre-order screen. Soonest ship date
 * first, so the next thing to land leads — rows with no date yet sort last
 * rather than to the front, which is what `nulls last` buys.
 */
async function fetchPreorderProducts(): Promise<Product[]> {
  const [rows, aggregates, booked] = await Promise.all([
    db
      .select()
      .from(products)
      .where(and(isNull(products.sellerId), eq(products.preorder, true)))
      .orderBy(sql`${products.preorderShipsAt} asc nulls last`, asc(products.id)),
    reviewAggregates(),
    preorderBookedCounts(),
  ])

  return rows.map((row) =>
    toProduct(row, aggregates.get(row.id), undefined, undefined, booked.get(row.id) ?? 0),
  )
}

export const getPreorderProducts = unstable_cache(
  fetchPreorderProducts,
  ['preorder-products'],
  { tags: ['catalogue'], revalidate: 60 },
)

/**
 * The same list, uncached, for the admin pre-order screen — an admin deciding
 * whether to open more allocation must never be reading a minute-old count.
 */
export async function getAdminPreorderProducts(): Promise<Product[]> {
  return fetchPreorderProducts()
}

/**
 * One pre-order product for the booking checkout, resolved out of the list that
 * page's siblings have already cached rather than with a query of its own — a
 * round trip to Neon costs more than scanning a handful of rows.
 *
 * Returns undefined for an id that is not a pre-order at all, which is what
 * lets the route `notFound()` on a hand-typed `?p=` instead of rendering a
 * booking form for shelf stock.
 */
export async function getPreorderProductById(
  id: string,
): Promise<Product | undefined> {
  const all = await getPreorderProducts()
  return all.find((product) => product.id === id)
}

/**
 * Detail-page gallery: the primary shot followed by this product's own extra
 * images.
 *
 * This used to pad the list out with photos of *other* products from the same
 * category whenever a product had no `product_images` rows — which was always,
 * because nothing wrote to that table. The result was a thumbnail strip where
 * slots 2–4 showed different garments entirely. Now that the admin form writes
 * the gallery, a product with one photo correctly gets a one-item list and the
 * thumbnail strip hides itself.
 */
export async function getProductImages(product: Product): Promise<string[]> {
  const extra = await db
    .select({ url: productImages.url })
    .from(productImages)
    .where(eq(productImages.productId, product.id))
    .orderBy(asc(productImages.position))

  return [product.image, ...extra.map((row) => row.url)]
}

/** Free-text search over English and Bangla product names. */
export async function searchProducts(query: string): Promise<Product[]> {
  const term = `%${query.trim()}%`
  const [rows, aggregates] = await Promise.all([
    db
      .select()
      .from(products)
      .where(
        and(
          isNull(products.sellerId),
          eq(products.preorder, false),
          or(
            sql`${products.name}->>'en' ILIKE ${term}`,
            sql`${products.name}->>'bn' ILIKE ${term}`,
          ),
        ),
      ),
    reviewAggregates(),
  ])
  return rows.map((row) => toProduct(row, aggregates.get(row.id)))
}

async function fetchAllCategories(): Promise<Category[]> {
  const rows = await db.select().from(categories)
  const counts = await db
    .select({
      category: products.category,
      count: sql<string>`count(*)`,
    })
    .from(products)
    // Matches what the category page actually lists, so the "12 items" count
    // on the tile cannot promise rows the page then filters away.
    .where(and(isNull(products.sellerId), eq(products.preorder, false)))
    .groupBy(products.category)

  const countMap = new Map(counts.map((row) => [row.category, Number(row.count)]))

  // The four seeded categories keep their editorial order; anything the admin
  // adds later sorts alphabetically after them. `indexOf` returns -1 for an
  // unknown slug, so it has to be mapped past the end of the known list rather
  // than used directly — otherwise new categories would sort to the front.
  const order: CategorySlug[] = ['men', 'women', 'kids', 'accessories']
  const rank = (slug: CategorySlug) => {
    const index = order.indexOf(slug)
    return index === -1 ? order.length : index
  }

  return rows
    .map((row) => ({
      slug: row.slug as CategorySlug,
      name: row.name,
      href: `/${row.slug}`,
      image: row.image,
      itemCount: countMap.get(row.slug as CategorySlug) ?? 0,
    }))
    .sort((a, b) => rank(a.slug) - rank(b.slug) || a.slug.localeCompare(b.slug))
}

export const getAllCategories = unstable_cache(
  fetchAllCategories,
  ['all-categories'],
  { tags: ['catalogue'], revalidate: 60 },
)

/**
 * Every catalogue in the store, ordered the way the dropdowns render them.
 *
 * One flat list rather than a query per category: there are a few dozen rows
 * at most, the header's mega-menu needs the lot anyway, and grouping them by
 * `categorySlug` on the client costs nothing next to a Neon round trip each.
 */
async function fetchAllCatalogues(): Promise<Catalogue[]> {
  const rows = await db
    .select()
    .from(catalogues)
    .orderBy(asc(catalogues.categorySlug), asc(catalogues.position), asc(catalogues.slug))

  return rows.map((row) => ({
    slug: row.slug,
    categorySlug: row.categorySlug,
    name: row.name,
    position: row.position,
  }))
}

export const getAllCatalogues = unstable_cache(
  fetchAllCatalogues,
  ['all-catalogues'],
  { tags: ['catalogue'], revalidate: 60 },
)

export async function getCategory(
  slug: CategorySlug,
): Promise<Category | undefined> {
  const all = await getAllCategories()
  return all.find((category) => category.slug === slug)
}
