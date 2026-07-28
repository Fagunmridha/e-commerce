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
  /** 10 means "10%" for `percent` and "$10" for `fixed`. */
  value: doublePrecision('value').notNull(),
  minOrder: doublePrecision('min_order').notNull().default(0),
  /** Caps a percent coupon — "20% off, up to $30". Null means uncapped. */
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
 * Editorial slots on the storefront — today the homepage hero, with room for
 * the offer strip and announcement bar later.
 *
 * `startsAt` / `endsAt` are what let an Eid or Puja slide be written a week
 * early and go live on its own. The window is evaluated at request time rather
 * than in SQL (see lib/banners.ts) so caching cannot make a slide late.
 */
export const banners = pgTable('banners', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Natural key so the seed can upsert without duplicating rows. */
  slug: text('slug').notNull().unique(),
  placement: text('placement', {
    enum: ['hero', 'offer', 'announcement'],
  })
    .notNull()
    .default('hero'),
  image: text('image').notNull(),
  /** Small eyebrow line above the headline. */
  label: jsonb('label').$type<Localized>(),
  title: jsonb('title').$type<Localized>().notNull(),
  /** Tail of the headline, rendered in the primary colour. */
  highlight: jsonb('highlight').$type<Localized>(),
  subtitle: jsonb('subtitle').$type<Localized>(),
  ctaLabel: jsonb('cta_label').$type<Localized>(),
  ctaHref: text('cta_href').notNull().default('/shop'),
  /** Null means "no start" / "no end" — an always-on slide. */
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type UserRow = typeof users.$inferSelect
export type CategoryRow = typeof categories.$inferSelect
export type ProductRow = typeof products.$inferSelect
export type OrderRow = typeof orders.$inferSelect
export type OrderItemRow = typeof orderItems.$inferSelect
export type ReviewRow = typeof reviews.$inferSelect
export type BannerRow = typeof banners.$inferSelect
export type CouponRow = typeof coupons.$inferSelect
export type OrderEventRow = typeof orderEvents.$inferSelect
export type BannerPlacement = BannerRow['placement']
