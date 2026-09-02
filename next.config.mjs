/**
 * The host R2 serves uploads from, read from the same variable lib/r2.ts builds
 * public URLs with. Deriving it beats hardcoding: the value is an r2.dev URL in
 * development and img.<domain> in production, and a mismatch between the two
 * files would mean every uploaded image 400s from the optimizer.
 */
const r2Hostname = (() => {
  try {
    return new URL(process.env.R2_PUBLIC_URL ?? '').hostname
  } catch {
    return null
  }
})()

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Two `next dev` instances cannot share one build directory — the second to
  // start fails on the lock in `.next/dev`. Overridable so a throwaway server
  // (a second port, to look at a change beside the one already running) gets
  // its own, without anyone having to edit this file to do it.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Optimization is ON, which is what makes `hostname: '**'` unacceptable
    // here: with it, `/_next/image?url=…` would fetch any URL a visitor names,
    // server-side — an open SSRF proxy. Every host below is one we control or
    // have deliberately chosen, and next/image throws on anything else. That
    // throw is the trade: an admin can no longer paste an image URL from an
    // arbitrary host. Add the host here if that ever needs to change.
    remotePatterns: [
      // The seed catalogue runs on these.
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Anything uploaded through the app lands in Cloudflare R2 — an
      // r2.dev URL in development, img.<domain> once the custom domain is on.
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      ...(r2Hostname && !r2Hostname.endsWith('.r2.dev')
        ? [{ protocol: 'https', hostname: r2Hostname }]
        : []),
    ],
    // AVIF first, WebP for the browsers that lack it. A product shot that was
    // 200 KB of JPEG lands at roughly 40–60 KB, which on a Bangladeshi mobile
    // connection is the difference the shopper actually feels.
    formats: ['image/avif', 'image/webp'],
    // Cache a derived size for a month. Product photos are replaced by
    // uploading a *new* object key, so a stale variant is not a risk.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  // lib/image-hosts.ts needs the R2 host on the client to warn the admin about
  // a pasted URL next/image would throw on. Mirrored here rather than asking
  // for a second NEXT_PUBLIC_ variable in .env, which would be one more thing
  // to keep in step. The value is a public CDN URL — nothing secret.
  env: {
    NEXT_PUBLIC_R2_PUBLIC_URL: process.env.R2_PUBLIC_URL ?? '',
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ]
  },
}

export default nextConfig
