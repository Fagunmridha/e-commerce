import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import type { Localized } from '@/lib/i18n'
import type { CategorySlug } from '@/lib/types'

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
  colors: jsonb('colors').$type<Localized[]>(),
  description: jsonb('description').$type<Localized>(),
  stock: integer('stock').notNull().default(0),
  /**
   * Smallest quantity a buyer may take in one order. 1 means no restriction,
   * which is every house product; wholesalers set their own per listing.
   */
  moq: integer('moq').notNull().default(1),
  /**
   * Which approved wholesaler listed this. Null is a house product — the store
   * owner's own stock. Non-null rows show in the wholesale marketplace and are
   * kept out of the ordinary shop listings.
   */
  sellerId: uuid('seller_id').references(() => wholesalerApplications.id, {
    onDelete: 'cascade',
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

/** Extra gallery shots; the primary `products.image` is always shown first. */
export const productImages = pgTable('product_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  position: integer('position').notNull().default(0),
})

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
  notes: text('notes'),
  paymentMethod: text('payment_method', {
    enum: ['cod', 'mobile', 'card'],
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
})

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
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

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
   * an unguessable suffix — fine for a tax token, a trade licence or a shop
   * front, which is why the form asks for nothing more sensitive (no NID).
   */
  taxTokenImage: text('tax_token_image'),
  tradeLicenseImage: text('trade_license_image'),
  shopPhoto: text('shop_photo'),

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
export type WholesalerApplicationRow =
  typeof wholesalerApplications.$inferSelect
