/**
 * Slugs a category may not take.
 *
 * `app/[category]/page.tsx` sits at the root of the site, and Next matches a
 * static segment before a dynamic one at the same depth. So a category called
 * "shop" would save without complaint, appear in the navigation, and link
 * forever to /shop — the product listing page — with nothing anywhere
 * reporting a problem. Refusing the name is the only place that failure can be
 * caught, because after the row exists it looks like a working link.
 *
 * This list mirrors the top-level folders in app/ plus the metadata routes.
 * Adding a top-level route means adding it here too.
 */
export const RESERVED_CATEGORY_SLUGS = new Set([
  'about',
  'account',
  'actions',
  'admin',
  'api',
  'checkout',
  'contact',
  'lp',
  'preorder',
  'privacy-policy',
  'product',
  'return-policy',
  'shipping-policy',
  'shop',
  'sign-in',
  'sign-up',
  'terms',
  'wholesale',
  'wishlist',
  // Metadata routes and Next's own prefix, which never reach page routing but
  // would make a category unreachable just the same.
  'robots.txt',
  'sitemap.xml',
  'favicon.ico',
  '_next',
])
