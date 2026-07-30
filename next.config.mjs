/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
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
      // Product images may still be admin-pasted URLs, so the host is not known ahead of
      // time and next/image would otherwise throw on an unlisted one. Safe only
      // because `unoptimized` is true: Next never fetches these server-side, so
      // there is no SSRF surface. Narrow this list before turning optimization
      // on.
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
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
