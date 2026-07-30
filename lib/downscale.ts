/**
 * Shrinks an image in the browser before it is uploaded.
 *
 * Uploads go straight from the browser to R2 with a presigned PUT — the bytes
 * never reach a route handler (see app/api/upload/route.ts), so there is no
 * server-side hook where a resize could happen. Doing it here is not a
 * workaround for that: it is strictly better, because a phone photo is 4–5 MB
 * of 4000px sensor data and re-encoding it first means the admin uploads ~200 KB
 * instead, over what is often a slow connection.
 *
 * Next's image optimizer resizes on delivery, so this is not what makes the
 * storefront fast — it caps what the optimizer has to chew through, and keeps
 * the stored original from being pointlessly enormous.
 *
 * Falls back to the untouched file whenever anything goes wrong: an upload that
 * works is worth more than one that is small, and the 5 MB cap still applies.
 */

/** Longest edge, in pixels, that a product or category shot is kept at. */
const MAX_EDGE = 1600

/**
 * Documents (trade licences, tax tokens) are read, not looked at, so they keep
 * more resolution and a higher quality — downsampling small print to 1600px is
 * how an admin ends up unable to check a licence number.
 */
const DOCUMENT_MAX_EDGE = 2200

export type DownscaleKind = 'photo' | 'document'

const QUALITY: Record<DownscaleKind, number> = {
  photo: 0.82,
  document: 0.92,
}

function targetSize(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } | null {
  const longest = Math.max(width, height)
  // Already small enough — re-encoding would only lose detail.
  if (longest <= maxEdge) return null

  const scale = maxEdge / longest
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  }
}

/**
 * Returns a WebP copy scaled to fit `MAX_EDGE`, or the original file when it is
 * already small enough, when the browser cannot do the work, or when anything
 * throws.
 *
 * WebP because every browser that can run this code can also display it, and it
 * is roughly half the bytes of the JPEG it replaces at the same quality.
 */
export async function downscaleImage(
  file: File,
  kind: DownscaleKind = 'photo',
): Promise<File> {
  if (typeof createImageBitmap !== 'function') return file

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    // An AVIF the browser cannot decode, a corrupt file — let the server and
    // the size cap deal with it.
    return file
  }

  try {
    const maxEdge = kind === 'document' ? DOCUMENT_MAX_EDGE : MAX_EDGE
    const size = targetSize(bitmap.width, bitmap.height, maxEdge)

    // Nothing to gain: it is already within bounds and already a modern format.
    if (!size && (file.type === 'image/webp' || file.type === 'image/avif')) {
      return file
    }

    const canvas = document.createElement('canvas')
    canvas.width = size?.width ?? bitmap.width
    canvas.height = size?.height ?? bitmap.height

    const context = canvas.getContext('2d')
    if (!context) return file
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', QUALITY[kind]),
    )
    // `toBlob` returns null when the format is unsupported.
    if (!blob) return file

    // Re-encoding a small, already-efficient image can make it bigger; when it
    // does, the original is the better upload.
    if (blob.size >= file.size) return file

    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', {
      type: 'image/webp',
      lastModified: file.lastModified,
    })
  } catch {
    return file
  } finally {
    bitmap.close()
  }
}
