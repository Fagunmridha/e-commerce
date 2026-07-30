/**
 * The hosts next/image is allowed to fetch from.
 *
 * This has to agree with `images.remotePatterns` in next.config.mjs, and it is
 * duplicated rather than imported because that config is not reachable from
 * client code. The cost of them drifting apart is real: next/image *throws* on
 * an unconfigured host, so a URL that passes here but not there does not
 * degrade — it takes out every page the product appears on.
 *
 * Which is the whole reason this file exists. The uploader still offers a
 * "paste a URL" escape hatch, and before image optimization was turned on that
 * accepted anything. Now it cannot, so the admin needs to be told at the moment
 * they paste rather than by a broken storefront later.
 */

/** Kept in step with next.config.mjs — see the note above. */
const ALLOWED_HOSTS = [
  'images.unsplash.com',
  // Cloudflare R2: the r2.dev subdomain in development, the custom image
  // domain in production. Both are exposed to the client through this var.
  ...(() => {
    try {
      return [new URL(process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? '').hostname]
    } catch {
      return []
    }
  })(),
]

function hostAllowed(host: string): boolean {
  if (host.endsWith('.r2.dev')) return true
  return ALLOWED_HOSTS.includes(host)
}

/**
 * Whether next/image will render this URL. Empty passes: an empty field is
 * "no image yet", which the forms already handle, not a bad host.
 */
export function isRenderableImageUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return true
  // Anything served from our own origin (/placeholder.svg and friends).
  if (trimmed.startsWith('/')) return true

  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'https:' && hostAllowed(parsed.hostname)
  } catch {
    return false
  }
}

/** The message shown when a pasted URL will not render. */
export const IMAGE_HOST_ERROR =
  'That host is not allowed for images. Upload the file instead, or use an images.unsplash.com link.'
