import {
  boolean,
  date,
  doublePrecision,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import type { Localized } from '@/lib/i18n'
import type { CategorySlug, ProductColor } from '@/lib/types'

/**
 * Users mirror Clerk accounts. Clerk owns authentication; this table owns the
 * app-level `role`, so an admin can promote anyone straight from the database.
 */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkId: text('clerk_id').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  role: text('role', { enum: ['customer', 'admin'] })
    .notNull()
    .default('customer'),
  /**
   * Which side of the wholesale programme this account joined, or null for the
   * ordinary shopper who never picked one.
   *
   * A single nullable column rather than two flags, because the two sides are
   * mutually exclusive by rule: a buyer orders trade stock and never lists any,
   * a seller lists it and never orders any. One column makes that impossible to
   * violate instead of merely discouraged.
   *
   * Separate from `role` above, which is the app-level admin/customer axis —
   * an admin is still allowed to join either side.
   *
   * Picking `seller` only opens the application; it is the `approved` row in
   * `wholesaler_applications` that actually lets them list anything. Picking
   * `buyer` needs no approval and takes effect immediately.
   */
  wholesaleRole: text('wholesale_role', { enum: ['buyer', 'seller'] }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const categories = pgTable('categories', {
  slug: text('slug').primaryKey(),
  name: jsonb('name').$type<Localized>().notNull(),
  image: text('image').notNull(),
  /**
   * Which side of the store may use this row. The four seeded categories
   * backfill to `both` — they are shop aisles that wholesalers also trade in,
   * and narrowing them would have emptied /men overnight.
   *
   * A grouping row like "Cloth" is kept `wholesale`: it is a seller's trade
   * line rather than an aisle, so no tile appears on the homepage and no
   * `/cloth` page is ever built.
   */
  scope: text('scope', { enum: ['retail', 'wholesale', 'both'] })
    .notNull()
    .default('both'),
  /**
   * The trade line this category sits under — "Cloth" for Men's.
   *
   * Null means the row *is* a line, and a line is what a wholesaler picks when
   * they apply. The tree is deliberately capped at two levels: a parent may not
   * itself have a parent. Going deeper would make four levels once catalogues
   * are counted, and no screen wants to draw that. The cap lives in
   * `categorySchema` and `upsertCategory`, not in the database.
   *
   * RESTRICT: deleting a line that still has children would orphan them, and
   * those children are what every seller approval hangs off.
   */
  parentSlug: text('parent_slug')
    .references((): AnyPgColumn => categories.slug, { onDelete: 'restrict' })
    .$type<CategorySlug>(),
  /**
   * Admin-controlled order within the parent line; ties break on slug. Lines
   * themselves order against each other, since they share a null parent.
   *
   * Stored rather than derived because the shop's aisles are an editorial
   * decision — Men's before Women's is a choice about the storefront, not a
   * fact about the rows. It replaces a hard-coded list of the four seeded
   * slugs in `fetchAllCategories`, which sorted anything added later to the
   * end by definition.
   */
  position: integer('position').notNull().default(0),
  /**
   * `inactive` takes the row out of every list a *new* choice is made from —
   * the storefront tiles, the seller's product form, the admin's product form
   * — while leaving `products.category` alone. Nothing is reassigned and
   * nothing is deleted, so flipping it back restores the aisle whole.
   *
   * The filter lives in `getRetailCategories`/`getWholesaleCategories`, beside
   * the scope filter; `getAllCategories` stays unfiltered because the admin
   * console must be able to see and edit what it just switched off.
   */
  status: text('status', { enum: ['active', 'inactive'] })
    .notNull()
    .default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  // Every read of the tree orders by position within a parent.
  index('categories_parent_position_idx').on(table.parentSlug, table.position),
  /**
   * No two rows under the same parent may share an English name.
   *
   * `coalesce` is load-bearing: Postgres treats NULLs as distinct in a unique
   * index, so without it two trade lines could both be called "Electronics" —
   * which is exactly the pair an admin is most likely to create by accident.
   * Lower-cased so "Jeans" and "jeans" collide too.
   */
  uniqueIndex('categories_parent_name_idx').on(
    sql`coalesce(${table.parentSlug}, '')`,
    sql`lower(${table.name}->>'en')`,
  ),
])

/**
 * The second level of the catalogue tree: "Jeans" and "Shirts" under Men's,
 * "Borka", "Three-piece" and "Saree" under Women's.
 *
 * Its own table rather than a free-text column on `products` so the two
 * languages stay paired, the admin can rename one in a single place, and the
 * category pages can list the filter chips without first scanning every
 * product to discover what values exist.
 *
 * `slug` is store-wide unique rather than unique-per-category — the URLs
 * (`/men?catalogue=jeans`) read better for it, and nothing wants two different
 * "jeans" anyway.
 */
export const catalogues = pgTable('catalogues', {
  slug: text('slug').primaryKey(),
  categorySlug: text('category_slug')
    .notNull()
    .references(() => categories.slug, { onDelete: 'cascade' })
    .$type<CategorySlug>(),
  name: jsonb('name').$type<Localized>().notNull(),
  /** Admin-controlled order within the parent category; ties break on slug. */
  position: integer('position').notNull().default(0),
  /** Same meaning as `categories.status`: hidden from new choices, not deleted. */
  status: text('status', { enum: ['active', 'inactive'] })
    .notNull()
    .default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('catalogues_category_slug_idx').on(table.categorySlug),
  /**
   * The target of `products_category_catalogue_fk`. `slug` is already the
   * primary key, so this pair is unique by construction — it exists only so a
   * foreign key has a (category, catalogue) pair to point at.
   */
  uniqueIndex('catalogues_category_slug_pair_idx').on(
    table.categorySlug,
    table.slug,
  ),
  /** As on `categories` — no duplicate English names under one category. */
  uniqueIndex('catalogues_category_name_idx').on(
    table.categorySlug,
    sql`lower(${table.name}->>'en')`,
  ),
])

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: jsonb('name').$type<Localized>().notNull(),
  price: doublePrecision('price').notNull(),
  oldPrice: doublePrecision('old_price'),
  image: text('image').notNull(),
  category: text('category')
    .notNull()
    .references(() => categories.slug, { onDelete: 'restrict' })
    .$type<CategorySlug>(),
  /**
   * Which catalogue within `category` this sits in — "jeans" under men's.
   *
   * Nullable: a product with no catalogue shows under "All". When set, it is
   * held to its category by `products_category_catalogue_fk` below — a
   * *composite* key on (category, catalogue_slug) → catalogues(category_slug,
   * slug). A single-column key could only say "this catalogue exists"; the pair
   * says "this catalogue exists *under this category*", which is what makes
   * Saree-under-Men's-Wear impossible at the database, whatever the code does.
   *
   * RESTRICT both ways. Deleting a catalogue that still holds products is
   * refused (it used to SET NULL and quietly unfile them), and so is moving a
   * catalogue to another category while products point at it.
   */
  catalogueSlug: text('catalogue_slug'),
  badge: text('badge', { enum: ['new', 'sale'] }),
  /**
   * Marks the row as part of the homepage's "Combo Package" rail — a bundle
   * deal the admin curates by hand, independent of `badge`: a product can be
   * both on sale and a combo pick.
   */
  isCombo: boolean('is_combo').notNull().default(false),
  sizes: text('sizes').array(),
  /**
   * `[{ name: { en, bn }, hex? }]`. It was `[{ en, bn }]` until migration 0012
   * reshaped the rows by hand — Drizzle emits no SQL for a `$type<>` change, so
   * this assertion is only as true as that migration having run. `toColors` in
   * lib/products.ts normalises either shape on read, which is what keeps a
   * `db:push`-built database working.
   */
  colors: jsonb('colors').$type<ProductColor[]>(),
  /** Per-product selling points — "100% Cotton", "Breathable". */
  highlights: jsonb('highlights').$type<Localized[]>(),
  description: jsonb('description').$type<Localized>(),
  /**
   * Pieces available. For a pre-order row this is the *allocation* the admin
   * opened — set it to 100 and the hundredth booking takes it to nought, which
   * is what turns the Coming Soon card over to "sold out".
   */
  stock: integer('stock').notNull().default(0),
  /**
   * Smallest quantity a buyer may take in one order. 1 means no restriction,
   * which is every house product; wholesalers set their own per listing.
   */
  moq: integer('moq').notNull().default(1),
  /**
   * Marks a row as upcoming stock, taken on pre-order rather than sold from the
   * shelf. Pre-order rows are kept out of /shop, the category pages and search
   * — they appear only in the Coming Soon rail and on their own detail page —
   * so "Add to Cart" is never offered on something that cannot ship yet.
   */
  preorder: boolean('preorder').notNull().default(false),
  /**
   * The date bookings are promised to ship from. A `date`, not a `timestamp`:
   * the admin picks a calendar day, and storing it as an instant would have it
   * drift across a timezone boundary on the way to the customer's card.
   */
  preorderShipsAt: date('preorder_ships_at', { mode: 'string' }),
  /**
   * How much of a booking must be paid up front, as a percentage of the line's
   * goods value. Null falls back to `DEFAULT_ADVANCE_PCT`; 0 means a pre-order
   * taken on pure cash-on-delivery.
   *
   * A percentage rather than a flat amount so it scales with quantity without
   * anyone having to decide whether "৳500 advance" is per piece or per order,
   * and so discounting the product does not quietly turn the advance into 90%
   * of the price. Nullable so the column is additive over pre-orders that were
   * created before it existed.
   */
  preorderAdvancePct: integer('preorder_advance_pct'),
  /**
   * Which approved wholesaler listed this. Null is a house product — the store
   * owner's own stock. Non-null rows show in the wholesale marketplace and are
   * kept out of the ordinary shop listings.
   */
  sellerId: uuid('seller_id').references(() => wholesalerApplications.id, {
    onDelete: 'cascade',
  }),
  /**
   * The store's cut of this listing's line value, as a percentage. Null falls
   * back to `DEFAULT_COMMISSION_PCT`; 0 means the store takes nothing.
   *
   * A percentage rather than a flat amount, for the same reason
   * `preorder_advance_pct` is one: it scales with quantity without anyone
   * having to decide whether "৳50" is per piece or per order.
   *
   * Deducted, never added. `price` stays what the buyer pays and the seller's
   * payout is that minus this — so raising the rate never moves a price the
   * shop set. Meaningless on a house product (`seller_id IS NULL`), where the
   * store already keeps the lot, so the admin form only offers it on a
   * marketplace listing.
   */
  commissionPct: integer('commission_pct'),
  /**
   * Whether this listing may be seen by anyone but its owner.
   *
   * Defaulted to `approved`, which is load-bearing in two directions. Every row
   * that existed before this column did is live stock that must stay live —
   * defaulting to `pending` would have emptied the marketplace on deploy. And a
   * *house* product is written by the admin, who is the approver: sending the
   * store owner's own stock into a queue they would then have to approve is a
   * loop with no one else in it. `upsertSellerProduct` writes `pending`
   * explicitly, which is the only path that needs a verdict.
   *
   * `draft` is in the enum because the workflow names it; nothing writes it
   * yet — there is no "save without submitting" on the seller form. Every state
   * other than `approved` is treated identically by the read gates, so adding
   * the door later changes no query.
   *
   * Separate from `wholesaler_applications.status`, which gates the whole shop.
   * Both have to say yes: suspending a shop hides approved listings, and a
   * rejected listing stays hidden under an approved shop.
   */
  approvalStatus: text('approval_status', {
    enum: ['draft', 'pending', 'approved', 'rejected', 'suspended'],
  })
    .notNull()
    .default('approved'),
  /** Why it was turned down — shown to the seller, who fixes it and resubmits. */
  rejectionReason: text('rejection_reason'),
  /** When it last entered the queue. Null on house stock, which never does. */
  submittedAt: timestamp('submitted_at'),
  reviewedAt: timestamp('reviewed_at'),
  reviewedByUserId: integer('reviewed_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  // Every catalogue read filters on `seller_id IS NULL` (house stock) or joins
  // on it (the marketplace), and orders by `created_at`. Postgres will happily
  // sequential-scan a 16-row table, so this buys nothing today — it is here so
  // the queries do not quietly turn into scans as the catalogue grows.
  index('products_seller_id_idx').on(table.sellerId),
  index('products_category_idx').on(table.category),
  index('products_catalogue_slug_idx').on(table.catalogueSlug),
  foreignKey({
    name: 'products_category_catalogue_fk',
    columns: [table.category, table.catalogueSlug],
    foreignColumns: [catalogues.categorySlug, catalogues.slug],
  })
    .onDelete('restrict')
    .onUpdate('restrict'),
  index('products_created_at_idx').on(table.createdAt),
  // The admin's review queue is "marketplace listings awaiting a verdict", and
  // every marketplace read now filters on this column as well as the join.
  index('products_approval_status_idx').on(table.approvalStatus),
])

/**
 * What an admin decides a product in a given part of the tree has to say about
 * itself — Size and Fabric under Clothing, RAM and Warranty under Electronics.
 *
 * A definition table rather than columns on `products`, because the fields are
 * the admin's to invent: adding "Screen size" to Electronics must not be a
 * migration, and a `products` table with one nullable column per attribute any
 * category ever wanted is a table that only grows.
 *
 * `scopeSlug` points at a `categories` row and is read *inclusively*: a
 * definition on a trade line applies to every category under it, so "Brand" is
 * declared once on Electronics rather than again on Mobile, Laptop and TV. A
 * definition on a leaf category applies only there. That is the whole
 * inheritance rule — see `definitionsForCategory` in lib/attributes.ts, which
 * is the one place it is implemented.
 */
export const attributeDefinitions = pgTable('attribute_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  scopeSlug: text('scope_slug')
    .notNull()
    .references(() => categories.slug, { onDelete: 'cascade' })
    .$type<CategorySlug>(),
  /**
   * The machine name, unique within its scope — `ram`, `fabric`. Stable across
   * renames of the label, because it is what `product_attribute_values` rows
   * are read back by in every report anyone ever writes.
   */
  key: text('key').notNull(),
  label: jsonb('label').$type<Localized>().notNull(),
  /**
   * How the field is drawn and what a value means. `select` reads `options`;
   * the rest ignore it. Kept deliberately small — four types cover every
   * example in the brief, and a fifth is a migration away when one does not.
   */
  type: text('type', {
    enum: ['text', 'number', 'select', 'boolean'],
  })
    .notNull()
    .default('text'),
  /** `select` only: the choices, in the order they are offered. */
  options: jsonb('options').$type<Localized[]>(),
  /** A required attribute blocks the product form until it is answered. */
  required: boolean('required').notNull().default(false),
  position: integer('position').notNull().default(0),
  /** `inactive` stops it being asked for without discarding answers already given. */
  status: text('status', { enum: ['active', 'inactive'] })
    .notNull()
    .default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('attribute_definitions_scope_key_idx').on(
    table.scopeSlug,
    table.key,
  ),
  index('attribute_definitions_scope_position_idx').on(
    table.scopeSlug,
    table.position,
  ),
])

/**
 * One product's answer to one definition.
 *
 * `value` is text whatever the definition's type says, and the type is applied
 * on the way in and out rather than in the column. A per-type column set
 * (`value_text`, `value_number`, …) buys nothing here: nothing sorts or sums
 * across attributes, every read is "this product's specs", and a single column
 * keeps the write one row per answer instead of one row per answer per shape.
 *
 * Both foreign keys cascade. Deleting a product takes its specs, and deleting a
 * definition takes every answer to it — an answer to a question nobody asks any
 * more is not data, it is litter. Switching the definition to `inactive` is the
 * move that keeps the answers.
 */
export const productAttributeValues = pgTable('product_attribute_values', {
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  definitionId: uuid('definition_id')
    .notNull()
    .references(() => attributeDefinitions.id, { onDelete: 'cascade' }),
  value: text('value').notNull(),
}, (table) => [
  primaryKey({ columns: [table.productId, table.definitionId] }),
  index('product_attribute_values_definition_idx').on(table.definitionId),
])

/** Extra gallery shots; the primary `products.image` is always shown first. */
export const productImages = pgTable('product_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  position: integer('position').notNull().default(0),
}, (table) => [
  index('product_images_product_id_idx').on(table.productId, table.position),
])

/**
 * Discount codes. `usageCount` is incremented with a conditional UPDATE at
 * checkout (see lib/orders.ts) rather than read-then-write, so two shoppers
 * racing for the last redemption cannot both win it.
 */
export const coupons = pgTable('coupons', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Stored trimmed and upper-cased; lookups normalise the same way. */
  code: text('code').notNull().unique(),
  description: jsonb('description').$type<Localized>(),
  type: text('type', { enum: ['percent', 'fixed'] }).notNull(),
  /** 10 means "10%" for `percent` and "৳10" for `fixed`. */
  value: doublePrecision('value').notNull(),
  minOrder: doublePrecision('min_order').notNull().default(0),
  /** Caps a percent coupon — "20% off, up to ৳300". Null means uncapped. */
  maxDiscount: doublePrecision('max_discount'),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  /** Null means unlimited redemptions. */
  usageLimit: integer('usage_limit'),
  usageCount: integer('usage_count').notNull().default(0),
  active: boolean('active').notNull().default(true),
  /** Surfaces the code on the homepage hero card while the coupon is live. */
  featured: boolean('featured').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

/** Invariant across every row: `total = subtotal - discount + shipping`. */
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: text('order_number').notNull().unique(),
  /** Null for guest checkout. */
  userId: integer('user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  /**
   * Which rate `shipping` was priced at. Nullable rather than defaulted: orders
   * placed before delivery zones existed were charged a single flat rate, and
   * stamping one of these on them would record a choice nobody made.
   */
  deliveryZone: text('delivery_zone', { enum: ['dhaka', 'outside'] }),
  notes: text('notes'),
  /**
   * `advance_cod` is set by `createOrder` on a pre-order, never chosen by a
   * shopper. Widening this list emits no SQL — the column is a bare `text` and
   * Drizzle's `enum` is a compile-time assertion, not a CHECK constraint.
   */
  paymentMethod: text('payment_method', {
    enum: ['cod', 'mobile', 'card', 'advance_cod'],
  }).notNull(),
  subtotal: doublePrecision('subtotal').notNull(),
  /** Defaulted so the column is additive over orders placed before coupons. */
  discount: doublePrecision('discount').notNull().default(0),
  /** Snapshot: survives the coupon being renamed or deleted. */
  couponCode: text('coupon_code'),
  couponId: uuid('coupon_id').references(() => coupons.id, {
    onDelete: 'set null',
  }),
  shipping: doublePrecision('shipping').notNull(),
  total: doublePrecision('total').notNull(),
  itemCount: integer('item_count').notNull(),
  status: text('status', {
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
  })
    .notNull()
    .default('pending'),
  /**
   * True when every line is a pre-order. Pre-order and in-stock items cannot
   * share an order (see `createOrder`), so this is a property of the whole
   * order rather than something to derive per line — which is what lets the
   * admin list badge and filter without joining `order_items`.
   */
  preorder: boolean('preorder').notNull().default(false),
  /**
   * The pre-order advance split. `advanceAmount + dueAmount = total` on every
   * row that has one, which is what lets the checkout summary, the confirmation
   * page and the admin card all agree without any of them re-deriving it.
   *
   * Both default to 0 so the columns are additive: an ordinary cash-on-delivery
   * order has no advance, and `paymentStatus` says exactly that rather than
   * leaving it to be inferred from a zero.
   */
  advanceAmount: doublePrecision('advance_amount').notNull().default(0),
  dueAmount: doublePrecision('due_amount').notNull().default(0),
  /**
   * `none` for every ordinary order. A booking starts at `advance_pending` and
   * an admin moves it once they have matched the transaction in their own
   * bKash/Nagad statement — there is no gateway, so a human is the verifier.
   *
   * There is deliberately no `settled` value for "the cash balance was
   * collected": `status = 'delivered'` already says that, and a second source
   * of truth for one fact is how the two drift apart.
   */
  paymentStatus: text('payment_status', {
    enum: ['none', 'advance_pending', 'advance_paid', 'advance_failed'],
  })
    .notNull()
    .default('none'),
  advanceMethod: text('advance_method', { enum: ['bkash', 'nagad'] }),
  advanceTrxId: text('advance_trx_id'),
  /**
   * Kept separately from `phone`: people pay from a different mobile-money
   * number than the one they give for delivery, and without this the admin has
   * nothing to match the transaction against.
   */
  advanceSenderPhone: text('advance_sender_phone'),
  advanceVerifiedAt: timestamp('advance_verified_at'),
  advanceVerifiedBy: integer('advance_verified_by_user_id').references(
    () => users.id,
    { onDelete: 'set null' },
  ),
  placedAt: timestamp('placed_at').notNull().defaultNow(),
})

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id').references(() => products.id, {
    onDelete: 'set null',
  }),
  /** Snapshot so history survives catalogue edits / deletions. */
  nameSnapshot: jsonb('name_snapshot').$type<Localized>().notNull(),
  imageSnapshot: text('image_snapshot').notNull(),
  quantity: integer('quantity').notNull(),
  size: text('size'),
  colorEn: text('color_en'),
  unitPrice: doublePrecision('unit_price').notNull(),
  /**
   * The ship-from date promised at the time of booking. Null on an ordinary
   * line. Snapshotted like `nameSnapshot` and `unitPrice`: the admin moving a
   * product's date afterwards must not silently rewrite what this customer was
   * told, and two pre-orders with different dates can share one order.
   */
  preorderShipsAt: date('preorder_ships_at', { mode: 'string' }),
  /**
   * Which shop's goods this line was. Null on house stock.
   *
   * Snapshotted at checkout rather than read live through `products.seller_id`,
   * because deleting a listing nulls `product_id` — which used to take the line
   * out of the shop's own order history, and would now take it out of any
   * settlement built from it.
   *
   * Still a foreign key, in the same spirit as `orders.coupon_id` beside
   * `coupon_code`: deleting a *product* does not touch it, and only deleting
   * the shop row itself — which cascades the listings away anyway — sets it
   * null. `settlements.shop_name_snapshot` is what survives that.
   */
  sellerId: uuid('seller_id').references(() => wholesalerApplications.id, {
    onDelete: 'set null',
  }),
  /**
   * The commission rate agreed when this line was sold. Snapshotted for exactly
   * the reason `unit_price` and `preorder_ships_at` are: an admin raising the
   * rate afterwards must not rewrite a settlement that has already been issued,
   * and may already have been paid.
   *
   * Null on a house line, and on every row written before this column existed.
   * Read it through `lineCommissionPct` in lib/commission.ts, never directly —
   * null there means "no rate was ever agreed", which is not the same as the
   * store default.
   */
  commissionPct: integer('commission_pct'),
}, (table) => [
  index('order_items_order_id_idx').on(table.orderId),
  // The "256 sold" line on the detail page sums this column per product.
  index('order_items_product_id_idx').on(table.productId),
  // Every seller-facing read — the shop's order book and its settlement lines
  // — filters on this now that attribution no longer joins through products.
  index('order_items_seller_id_idx').on(table.sellerId),
])

/**
 * Append-only status history. `orders.status` is still the current value; this
 * is what makes the admin timeline — and "who moved this to shipped, and
 * when?" — answerable at all.
 */
export const orderEvents = pgTable('order_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  status: text('status', {
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
  }).notNull(),
  note: text('note'),
  /** Null for the automatic event written when the order is placed. */
  actorUserId: integer('actor_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

/**
 * Customer reviews, moderated before they go public.
 *
 * `status` is stored rather than derived, and every read gates on it instead of
 * deleting rows: a review rejected by mistake is one click from being visible
 * again, and a rejected one cannot be silently resubmitted by the same
 * customer. Three states, not the four `wholesaler_applications` carries — a
 * shop is an ongoing relationship you can pause, a review is a one-shot
 * artefact, so approved → rejected *is* the un-publish.
 *
 * `featured` is purely a homepage concept. The product page shows every
 * approved review whatever its rating; the Coming Soon-style testimonial rail
 * shows approved reviews that are either featured or rated 4+.
 */
export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  authorName: text('author_name').notNull(),
  rating: integer('rating').notNull(),
  body: text('body').notNull(),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] })
    .notNull()
    .default('pending'),
  /** Admin-picked for the homepage testimonial rail. */
  featured: boolean('featured').notNull().default(false),
  /**
   * Internal moderation shorthand. Unlike `wholesaler_applications.review_note`
   * this is never shown back to the customer — a rejected review simply stays
   * invisible, because publishing the reason invites an argument.
   */
  reviewNote: text('review_note'),
  reviewedByUserId: integer('reviewed_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  // Every read now filters on status as well: the per-product list and the
  // single-product aggregate both narrow by product first.
  index('reviews_product_id_status_idx').on(table.productId, table.status),
  // The catalogue-wide aggregate and the homepage feed start from status.
  index('reviews_status_created_at_idx').on(table.status, table.createdAt),
])

/**
 * Messages sent from the public /contact form.
 *
 * Unlike `reviews`, nothing here is ever published — the row exists only so the
 * admin console can be the inbox. That is why the customer's own words are kept
 * verbatim and the workflow columns (`status`, `adminNote`) are internal.
 *
 * `userId` is nullable and set only when a signed-in shopper writes: the form
 * is open to strangers, so the identity that matters is the `email` and `phone`
 * typed into it, not an account. Both are stored as given rather than resolved
 * against `users`, because a customer who writes "my order never arrived" from
 * their work address must still be replyable at that address.
 */
export const contactMessages = pgTable('contact_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Set when the sender happened to be signed in. Null for a stranger. */
  userId: integer('user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  /**
   * Where the message is in the admin's own workflow. `new` is the inbox,
   * `replied` is done, `archived` is filed away (spam included) — no row is
   * deleted by the flow itself, so a message archived by mistake comes back.
   */
  status: text('status', { enum: ['new', 'read', 'replied', 'archived'] })
    .notNull()
    .default('new'),
  /** Internal shorthand — "refunded, see order #1042". Never shown publicly. */
  adminNote: text('admin_note'),
  handledByUserId: integer('handled_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  handledAt: timestamp('handled_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  // The inbox is "newest first, optionally narrowed to one status" — both the
  // default list and every status pill start from this index.
  index('contact_messages_status_created_at_idx').on(
    table.status,
    table.createdAt,
  ),
  // Backs the per-email flood check in `submitContactMessage`.
  index('contact_messages_email_created_at_idx').on(
    table.email,
    table.createdAt,
  ),
])

/**
 * B2B applications. One row per user (`userId` is unique) — a rejected
 * applicant edits and resubmits the same row, which drops back to `pending`.
 *
 * An `approved` row here is the *only* thing that makes someone a wholesaler.
 * Deliberately not a `users.role` value: role is single-valued, so an admin
 * could never also be a wholesaler, and every `role === 'customer'` check in
 * the app would have needed revisiting.
 *
 * The row is also the seller identity: `products.seller_id` points here, and
 * flipping `status` away from `approved` is what takes those listings off the
 * marketplace. Nothing is deleted, so re-approving brings the shop back whole.
 */
export const wholesalerApplications = pgTable('wholesaler_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),

  shopName: text('shop_name').notNull(),
  businessType: text('business_type', {
    enum: ['retail_shop', 'distributor', 'online_seller', 'other'],
  }).notNull(),
  /**
   * The shop's *primary* trade line — the first one it was approved for.
   *
   * `wholesaler_trade_lines` is the source of truth for what a shop may list
   * under; this is kept beside it as the one-line answer every screen that only
   * has room for one wants ("Cloth shop"), and as the fallback for a shop
   * approved before that table existed, whose grants the migration backfilled
   * but whose code path predates it.
   *
   * Nullable, because every shop approved before this column existed has none,
   * and an approved seller cannot resubmit their application to fill it in —
   * `app/wholesale/apply/page.tsx` sends them to the dashboard instead. An
   * admin sets it from the review screen.
   *
   * SET NULL rather than RESTRICT: falling back to "seller with no line" is a
   * state an admin can fix, whereas a category that one seller picked being
   * permanently undeletable is not.
   */
  categorySlug: text('category_slug')
    .references(() => categories.slug, { onDelete: 'set null' })
    .$type<CategorySlug>(),
  /** TIN / tax token. */
  taxToken: text('tax_token'),
  /** VAT registration (BIN). */
  binNumber: text('bin_number'),
  tradeLicenseNo: text('trade_license_no'),
  yearsInBusiness: integer('years_in_business'),

  contactName: text('contact_name').notNull(),
  phone: text('phone').notNull(),
  altPhone: text('alt_phone'),
  email: text('email').notNull(),
  website: text('website'),

  address: text('address').notNull(),
  city: text('city').notNull(),
  district: text('district'),
  postcode: text('postcode'),

  /**
   * Proof the admin reviews before approving. These are *public* R2 URLs with
   * an unguessable suffix — fine for a trade licence, a shop front, or the
   * owner standing in front of it, which is why the form asks for nothing more
   * sensitive (no NID).
   */
  tradeLicenseImage: text('trade_license_image'),
  shopPhoto: text('shop_photo'),
  /**
   * Passport-size photo of the owner — what ties a set of papers to a person.
   * Optional, like the two above: making it mandatory turned "apply" into "go
   * and find a photo first", and the admin can ask for it during review.
   */
  ownerPhoto: text('owner_photo'),

  note: text('note'),

  status: text('status', {
    enum: ['pending', 'approved', 'rejected', 'suspended'],
  })
    .notNull()
    .default('pending'),
  /** Shown back to the applicant — this is why they were turned down. */
  reviewNote: text('review_note'),
  reviewedByUserId: integer('reviewed_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  reviewedAt: timestamp('reviewed_at'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

/**
 * Which trade lines a shop asked for, and which of those an admin granted.
 *
 * A shop deals in more than one line — cloth and cosmetics out of the same
 * warehouse is ordinary — and the single `wholesaler_applications.category_slug`
 * could only ever hold the first. A join table rather than an array column
 * because the *verdict* is per line: an admin approves Clothing and refuses
 * Cosmetics on one application, and that is a fact about the pair, not about
 * either row alone.
 *
 * `requested` is what the applicant picked; `approved` is what they may
 * actually list under. A row is never deleted on refusal — it stays
 * `requested`, so the review screen keeps showing what was asked for and an
 * admin can grant it later without the shop reapplying.
 *
 * CASCADE on both sides. Deleting an application takes its lines with it, as it
 * does its listings. Deleting a *category* takes the grant with it too — a
 * composite primary key has no null to fall back to, unlike
 * `wholesaler_applications.category_slug`. The admin's delete confirmation
 * already counts the shops attached to a category, which is where that is said.
 */
export const wholesalerTradeLines = pgTable('wholesaler_trade_lines', {
  applicationId: uuid('application_id')
    .notNull()
    .references(() => wholesalerApplications.id, { onDelete: 'cascade' }),
  categorySlug: text('category_slug')
    .notNull()
    .references(() => categories.slug, { onDelete: 'cascade' })
    .$type<CategorySlug>(),
  status: text('status', { enum: ['requested', 'approved'] })
    .notNull()
    .default('requested'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.applicationId, table.categorySlug] }),
  // Every read is "the lines for this shop"; the primary key's leading column
  // already serves it, and this is here for the reverse — "which shops trade in
  // this line", which the category delete warning counts.
  index('wholesaler_trade_lines_category_idx').on(table.categorySlug),
])

/**
 * What the store owes one shop for one order.
 *
 * One row per (order, seller): the marketplace half of an order can carry two
 * shops' goods, and each is a separate debt with its own rate, its own document
 * and its own payment. House lines produce no row — the store keeps the lot.
 *
 * Invariant on every row: `gross_amount = commission_amount + payout_amount`,
 * the same shape as `orders.total = subtotal - discount + shipping`.
 * `gross_amount` is the shop's own line value and nothing else: delivery and
 * any coupon belong to the whole order and are the store's own, so neither
 * moves what a shop is owed. See lib/commission.ts for why.
 *
 * The row is written at *checkout*, not at delivery. Building it later would
 * mean reading the order's lines, grouping them, then writing — and Neon's HTTP
 * driver has no interactive transaction to hold that read and write together,
 * so two admins marking one order delivered could both insert. Written here it
 * rides the batch `createOrder` already runs, and delivery collapses to a
 * conditional UPDATE that is idempotent by construction.
 */
export const settlements = pgTable('settlements', {
  id: uuid('id').primaryKey().defaultRandom(),
  /**
   * `CP-ABC123-S1` — the order's number with the shop's position appended, so
   * it is derivable, stable, and readable off a printed sheet.
   */
  settlementNumber: text('settlement_number').notNull().unique(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  /**
   * Null only once the shop row itself is gone; `shop_name_snapshot` is then
   * the whole trace, exactly as `orders.name` is for a deleted customer.
   */
  sellerId: uuid('seller_id').references(() => wholesalerApplications.id, {
    onDelete: 'set null',
  }),
  shopNameSnapshot: text('shop_name_snapshot').notNull(),
  /**
   * `pending` — the order exists but has not been delivered.
   * `due`     — delivered; the store owes this money.
   * `paid`    — an admin has recorded the payment.
   * `void`    — the order was cancelled, or moved back out of delivered, before
   *             it was paid. Kept rather than deleted so the history reads.
   */
  status: text('status', { enum: ['pending', 'due', 'paid', 'void'] })
    .notNull()
    .default('pending'),
  grossAmount: doublePrecision('gross_amount').notNull(),
  commissionAmount: doublePrecision('commission_amount').notNull(),
  payoutAmount: doublePrecision('payout_amount').notNull(),
  /**
   * The rate, when every line in this settlement shared one. Null means the
   * shop's lines were sold at different rates and the document shows the
   * effective blend instead — the per-line rates live on `order_items`.
   */
  commissionPct: integer('commission_pct'),
  pieceCount: integer('piece_count').notNull(),
  lineCount: integer('line_count').notNull(),
  /**
   * When the order was delivered — the date a range statement bins on. The
   * first delivery wins: re-marking an order delivered does not move it.
   */
  settledAt: timestamp('settled_at'),
  paidAt: timestamp('paid_at'),
  paidByUserId: integer('paid_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  /** "bKash TrxID 9F2K…", "cash, 14 Mar". Free text; there is no gateway. */
  paidNote: text('paid_note'),
  voidedAt: timestamp('voided_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  // The idempotency guarantee, not an optimisation: whatever races upstream,
  // one order can owe one shop exactly once.
  uniqueIndex('settlements_order_seller_idx').on(table.orderId, table.sellerId),
  // The shop's own payouts page: "what am I owed", "what have I been paid".
  index('settlements_seller_status_idx').on(table.sellerId, table.status),
  // The date-range statement, and the admin's due queue.
  index('settlements_seller_settled_at_idx').on(table.sellerId, table.settledAt),
  index('settlements_status_settled_at_idx').on(table.status, table.settledAt),
])

export type UserRow = typeof users.$inferSelect
export type CategoryRow = typeof categories.$inferSelect
export type CatalogueRow = typeof catalogues.$inferSelect
export type ProductRow = typeof products.$inferSelect
/** Which side of the wholesale programme an account joined. */
export type WholesaleRole = NonNullable<UserRow['wholesaleRole']>
export type OrderRow = typeof orders.$inferSelect
export type OrderItemRow = typeof orderItems.$inferSelect
export type ReviewRow = typeof reviews.$inferSelect
export type CouponRow = typeof coupons.$inferSelect
export type OrderEventRow = typeof orderEvents.$inferSelect
export type ContactMessageRow = typeof contactMessages.$inferSelect
export type WholesalerApplicationRow =
  typeof wholesalerApplications.$inferSelect
export type SettlementRow = typeof settlements.$inferSelect

/**
 * Global settings for the store.
 * There should only ever be one row in this table (id = 1).
 */
export const storeSettings = pgTable('store_settings', {
  id: integer('id').primaryKey().default(1),
  defaultCommissionPct: integer('default_commission_pct').notNull().default(10),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type StoreSettingsRow = typeof storeSettings.$inferSelect
