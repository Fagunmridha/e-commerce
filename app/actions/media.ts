'use server'

import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getCurrentUser, requireAdmin } from '@/lib/auth'
import {
  R2_BUCKET,
  isOwnedImageUrl,
  isSellerKey,
  keyFromPublicUrl,
  r2,
} from '@/lib/r2'

/** True for URLs we host — anything else was typed in by hand and is not ours. */
export async function isOwnedImage(url: string): Promise<boolean> {
  return isOwnedImageUrl(url)
}

/**
 * Removes an image from R2. Callers pass a URL that came out of the database,
 * so the host check matters: without it this action would delete whatever URL
 * it was handed, and server actions are public endpoints.
 *
 * Silently ignores URLs we do not own — the seed catalogue is full of Unsplash
 * links, and "replace an Unsplash image" should not be an error.
 *
 * Objects under the seller folders only need a signed-in user, matching the
 * upload gate. Admin-only here would mean a wholesaler swapping their own
 * product photo left the old file behind on every edit.
 */
export async function deleteImage(url: string): Promise<void> {
  const key = keyFromPublicUrl(url)

  if (key && isSellerKey(key)) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Not authorized')
  } else {
    await requireAdmin()
  }

  if (!key || !R2_BUCKET) return

  await r2().send(
    new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }),
  )
}
