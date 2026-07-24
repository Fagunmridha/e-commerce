'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { products, users } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/auth'
import { updateOrderStatus, type OrderStatus } from '@/lib/orders'
import type { Localized } from '@/lib/i18n'
import type { CategorySlug } from '@/lib/types'

export async function setUserRole(
  userId: number,
  role: 'customer' | 'admin',
): Promise<void> {
  const me = await requireAdmin()
  // Guard against an admin accidentally removing their own last-admin access.
  if (me.id === userId && role !== 'admin') {
    throw new Error('You cannot remove your own admin role')
  }
  await db.update(users).set({ role }).where(eq(users.id, userId))
  revalidatePath('/admin/users')
}

export type ProductInput = {
  id: string
  name: Localized
  price: number
  oldPrice?: number | null
  image: string
  category: CategorySlug
  badge?: 'new' | 'sale' | null
  sizes?: string[] | null
  colors?: Localized[] | null
  description?: Localized | null
  stock: number
}

export async function upsertProduct(input: ProductInput): Promise<void> {
  await requireAdmin()
  const values = {
    id: input.id,
    name: input.name,
    price: input.price,
    oldPrice: input.oldPrice ?? null,
    image: input.image,
    category: input.category,
    badge: input.badge ?? null,
    sizes: input.sizes ?? null,
    colors: input.colors ?? null,
    description: input.description ?? null,
    stock: input.stock,
  }
  await db
    .insert(products)
    .values(values)
    .onConflictDoUpdate({ target: products.id, set: values })
  updateTag('catalogue')
  revalidatePath('/admin/products')
  revalidatePath('/shop')
  revalidatePath(`/product/${input.id}`)
}

export async function deleteProduct(id: string): Promise<void> {
  await requireAdmin()
  await db.delete(products).where(eq(products.id, id))
  updateTag('catalogue')
  revalidatePath('/admin/products')
  revalidatePath('/shop')
}

export async function setOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  await requireAdmin()
  await updateOrderStatus(orderId, status)
  revalidatePath('/admin/orders')
}
