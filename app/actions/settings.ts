'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { storeSettings } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/auth'

export async function getStoreSettings() {
  const [settings] = await db.select().from(storeSettings).where(eq(storeSettings.id, 1))
  
  if (!settings) {
    return { id: 1, defaultCommissionPct: 10, updatedAt: new Date() }
  }
  return settings
}

export async function updateStoreSettings(defaultCommissionPct: number) {
  await requireAdmin()

  await db.insert(storeSettings).values({
    id: 1,
    defaultCommissionPct,
  }).onConflictDoUpdate({
    target: storeSettings.id,
    set: { defaultCommissionPct, updatedAt: new Date() }
  })

  revalidatePath('/admin/settings')
  revalidatePath('/wholesale/dashboard/products/new')
}
