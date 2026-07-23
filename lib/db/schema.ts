import {
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

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: text('order_number').notNull().unique(),
  /** Null for guest checkout. */
  userId: integer('user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  postcode: text('postcode'),
  notes: text('notes'),
  paymentMethod: text('payment_method', {
    enum: ['cod', 'mobile', 'card'],
  }).notNull(),
  subtotal: doublePrecision('subtotal').notNull(),
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

export type UserRow = typeof users.$inferSelect
export type CategoryRow = typeof categories.$inferSelect
export type ProductRow = typeof products.$inferSelect
export type OrderRow = typeof orders.$inferSelect
export type OrderItemRow = typeof orderItems.$inferSelect
export type ReviewRow = typeof reviews.$inferSelect
