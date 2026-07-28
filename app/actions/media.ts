'use server'

import { del } from '@vercel/blob'
import { requireAdmin } from '@/lib/auth'

const BLOB_HOST_SUFFIX = '.public.blob.vercel-storage.com'

/** True for URLs we own — anything else was typed in by hand and is not ours to delete. */
export async function isBlobUrl(url: string): Promise<boolean> {
  try {
    return new URL(url).hostname.endsWith(BLOB_HOST_SUFFIX)
  } catch {
    return false
  }
}

/**
 * Removes an image from Blob storage. Callers pass a URL that came out of the
 * database, so the host check matters: without it this action would delete
 * whatever URL it was handed, and server actions are public endpoints.
 *
 * Silently ignores non-blob URLs — the seed catalogue is full of Unsplash
 * links, and "replace an Unsplash image" should not be an error.
 */
export async function deleteBlob(url: string): Promise<void> {
  await requireAdmin()

  if (!url || !(await isBlobUrl(url))) return

  await del(url)
}
