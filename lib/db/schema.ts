import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
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
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const categories = pgTable('categories', {
  slug: text('slug').primaryKey(),
  name: jsonb('name').$type<Localized>().notNull(),
  image: text('image').notNull(),
})

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
  badge: text('badge', { enum: ['new', 'sale'] }),
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
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  // Every catalogue read filters on `seller_id IS NULL` (house stock) or joins
  // on it (the marketplace), and orders by `created_at`. Postgres will happily
  // sequential-scan a 16-row table, so this buys nothing today — it is here so
  // the queries do not quietly turn into scans as the catalogue grows.
  index('products_seller_id_idx').on(table.sellerId),
  index('products_category_idx').on(table.category),
  index('products_created_at_idx').on(table.createdAt),
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
}, (table) => [
  index('order_items_order_id_idx').on(table.orderId),
  // The "256 sold" line on the detail page sums this column per product.
  index('order_items_product_id_idx').on(table.productId),
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
   * Passport-size photo of the owner — required by the form, since it is what
   * ties a set of papers to a person. Nullable all the same: the column arrived
   * after the first applications did.
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

export type UserRow = typeof users.$inferSelect
export type CategoryRow = typeof categories.$inferSelect
export type ProductRow = typeof products.$inferSelect
export type OrderRow = typeof orders.$inferSelect
export type OrderItemRow = typeof orderItems.$inferSelect
export type ReviewRow = typeof reviews.$inferSelect
export type CouponRow = typeof coupons.$inferSelect
export type OrderEventRow = typeof orderEvents.$inferSelect
export type ContactMessageRow = typeof contactMessages.$inferSelect
export type WholesalerApplicationRow =
  typeof wholesalerApplications.$inferSelect
