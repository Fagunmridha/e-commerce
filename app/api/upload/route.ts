import { randomUUID } from 'node:crypto'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getCurrentUser, requireAdmin } from '@/lib/auth'
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  R2_BUCKET,
  SELLER_FOLDERS,
  UPLOAD_FOLDERS,
  buildObjectKey,
  publicUrlFor,
  r2,
  type UploadFolder,
} from '@/lib/r2'

/**
 * Mints a short-lived presigned PUT so the browser can send a file straight to
 * R2. The bytes never pass through this route — route handlers cap out around
 * 4.5 MB on Vercel, which a photo off a phone camera clears easily.
 *
 * Everything the presign allows is decided here: which folder, which content
 * type, how big. `ContentType` is baked into the signature, so a URL minted for
 * a JPEG cannot be replayed to upload something else.
 */

type UploadRequest = {
  folder?: string
  filename?: string
  contentType?: string
  size?: number
}

function bad(message: string, status = 400) {
  return Response.json({ error: message }, { status })
}

export async function POST(request: Request): Promise<Response> {
  let body: UploadRequest
  try {
    body = (await request.json()) as UploadRequest
  } catch {
    return bad('Malformed request')
  }

  const folder = body.folder as UploadFolder | undefined
  if (!folder || !UPLOAD_FOLDERS.includes(folder)) {
    return bad('Unknown upload folder')
  }

  // The gate. Sellers may attach their own product shots and the documents
  // backing an application; everything else in the store — house product shots,
  // category art — stays admin-only.
  //
  // Any signed-in user passes, not only approved wholesalers: an applicant has
  // to upload their trade licence *before* anyone can approve them. The 5 MB and
  // image-type caps below are what keep that from being a free file host.
  try {
    if (SELLER_FOLDERS.includes(folder)) {
      const user = await getCurrentUser()
      if (!user) throw new Error('Not authorized')
    } else {
      await requireAdmin()
    }
  } catch {
    return Response.json({ error: 'Not authorized' }, { status: 401 })
  }

  const contentType = body.contentType ?? ''
  if (!ACCEPTED_IMAGE_TYPES.includes(contentType)) {
    return bad('Use a JPEG, PNG, WebP or AVIF image')
  }

  // The client checks this too, for a faster message — but that check is a
  // courtesy and this one is the rule.
  const size = Number(body.size)
  if (!Number.isFinite(size) || size <= 0 || size > MAX_UPLOAD_BYTES) {
    return bad('That image is over the 5 MB limit')
  }

  if (!R2_BUCKET) return bad('Storage is not configured', 500)

  const key = buildObjectKey(
    folder,
    body.filename ?? 'image',
    contentType,
    randomUUID().slice(0, 8),
  )

  try {
    const uploadUrl = await getSignedUrl(
      r2(),
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        ContentType: contentType,
        ContentLength: size,
      }),
      { expiresIn: 60 * 5 },
    )

    return Response.json({ uploadUrl, url: publicUrlFor(key), key })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    return bad(message, 500)
  }
}
