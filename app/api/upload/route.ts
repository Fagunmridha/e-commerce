import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { requireAdmin } from '@/lib/auth'

/**
 * Mints a short-lived client-upload token so the browser can send the file
 * straight to Vercel Blob. The bytes never pass through this route — server
 * actions and route handlers cap out around 4.5 MB on Vercel, which a photo
 * off a phone camera clears easily.
 *
 * The admin check runs *before* `handleUpload`, not only inside
 * `onBeforeGenerateToken`: the SDK validates its own env/token first, so a
 * guard living only in the callback is never reached when something upstream
 * fails, and "did the auth gate run?" stops being answerable.
 *
 * `blob.upload-completed` is Vercel calling back server-to-server with no
 * session cookie, so it is let through — `handleUpload` verifies that request
 * against the store token itself.
 */
export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as HandleUploadBody

  if (body?.type !== 'blob.upload-completed') {
    try {
      await requireAdmin()
    } catch {
      return Response.json({ error: 'Not authorized' }, { status: 401 })
    }
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/avif',
        ],
        // Images are served unoptimized (see next.config.mjs), so an oversized
        // upload lands on the shopper's phone at full weight.
        maximumSizeInBytes: 5 * 1024 * 1024,
        addRandomSuffix: true,
      }),
      // Intentionally empty: this callback never fires on localhost, so
      // anything important here would pass in dev and silently drop in prod.
      // The client receives `blob.url` from `upload()` and persists it through
      // the normal form action instead.
      onUploadCompleted: async () => {},
    })

    return Response.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    return Response.json({ error: message }, { status: 400 })
  }
}
