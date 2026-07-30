import 'server-only'
import { S3Client } from '@aws-sdk/client-s3'

/**
 * Cloudflare R2, reached over its S3-compatible API.
 *
 * Chosen over Vercel Blob for two reasons: R2's free tier allows commercial
 * use (Vercel's Hobby plan does not) and egress is free, which matters for a
 * catalogue whose whole job is serving product photos.
 *
 * Uploads go from the browser straight to R2 with a presigned PUT — the bytes
 * never pass through a route handler, which on Vercel would cap out around
 * 4.5 MB, well under what a phone camera produces.
 */

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `${name} is not set — see SETUP.md for the Cloudflare R2 setup steps`,
    )
  }
  return value
}

export const R2_BUCKET = process.env.R2_BUCKET ?? ''

/** The host images are served from: an r2.dev URL in dev, img.<domain> live. */
export const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? '').replace(/\/+$/, '')

/** Folders the app writes to. Only the `wholesale-*` pair is non-admin. */
export const UPLOAD_FOLDERS = [
  'products',
  'categories',
  'wholesale-products',
  'wholesale-documents',
] as const

export type UploadFolder = (typeof UPLOAD_FOLDERS)[number]

/**
 * The folders a signed-in non-admin may write to: product shots for their own
 * listings, and the tax token / trade licence / shop front photos that go with
 * an application. Documents are separate from listings because an applicant
 * uploads them *before* being approved, so the two cannot share a gate.
 */
export const SELLER_FOLDERS: readonly UploadFolder[] = [
  'wholesale-products',
  'wholesale-documents',
]

/** True for an object key that lives under one of the seller folders. */
export function isSellerKey(key: string): boolean {
  return SELLER_FOLDERS.some((folder) => key.startsWith(`${folder}/`))
}

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]

/**
 * The ceiling on what may be stored. Shoppers never see this weight — next/image
 * resizes on delivery, and the uploader re-encodes to a ~1600px WebP before the
 * bytes leave the browser (lib/downscale.ts) — so this is now a storage and
 * abuse limit rather than a page-weight one. Kept at 5 MB because the client
 * falls back to the original file whenever the re-encode cannot run.
 */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

let client: S3Client | null = null

export function r2(): S3Client {
  if (client) return client

  client = new S3Client({
    // R2 ignores the region but the SDK insists on one.
    region: 'auto',
    endpoint: `https://${required('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: required('R2_ACCESS_KEY_ID'),
      secretAccessKey: required('R2_SECRET_ACCESS_KEY'),
    },
  })
  return client
}

/**
 * Builds the object key. The extension comes from the *content type*, not from
 * the filename — the client can claim anything, and the presign pins the type
 * anyway, so deriving it from the checked value keeps the two in agreement.
 *
 * A random suffix keeps two shoppers uploading `shirt.jpg` from colliding, and
 * makes the resulting URL unguessable.
 */
export function buildObjectKey(
  folder: UploadFolder,
  filename: string,
  contentType: string,
  random: string,
): string {
  const base =
    filename
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'image'

  return `${folder}/${base}-${random}.${EXTENSIONS[contentType] ?? 'bin'}`
}

export function publicUrlFor(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`
}

/**
 * True for URLs we host. Callers hand this whatever is stored in the database,
 * so anything else — a pasted Unsplash link, say — is not ours to delete.
 */
export function isOwnedImageUrl(url: string): boolean {
  if (!url || !R2_PUBLIC_URL) return false
  try {
    return new URL(url).origin === new URL(R2_PUBLIC_URL).origin
  } catch {
    return false
  }
}

/** The object key behind one of our public URLs, or null if it is not ours. */
export function keyFromPublicUrl(url: string): string | null {
  if (!isOwnedImageUrl(url)) return null
  const key = new URL(url).pathname.replace(/^\/+/, '')
  return key || null
}
