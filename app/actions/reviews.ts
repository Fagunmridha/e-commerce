'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { reviews } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth'

export type SubmitReviewInput = {
  productId: string
  rating: number
  body: string
}

export async function submitReview(
  input: SubmitReviewInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: 'not-signed-in' }

  const rating = Math.round(input.rating)
  if (rating < 1 || rating > 5) return { ok: false, error: 'invalid-rating' }
  if (input.body.trim().length < 3) return { ok: false, error: 'empty-body' }

  await db.insert(reviews).values({
    productId: input.productId,
    userId: user.id,
    authorName: user.name || user.email.split('@')[0] || 'Customer',
    rating,
    body: input.body.trim(),
  })

  revalidatePath(`/product/${input.productId}`)
  return { ok: true }
}
