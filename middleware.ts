import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

/** Routes that require a signed-in user. This is authentication only —
 * authorization is checked against the database inside the matching layout:
 * /admin against `users.role`, and the wholesale market and seller dashboard
 * against an approved `wholesaler_applications` row. `/wholesale` itself stays
 * open because it is the pitch page carrying the Apply button; it lists no
 * products. */
const isProtectedRoute = createRouteMatcher([
  '/account(.*)',
  '/admin(.*)',
  '/wholesale/apply(.*)',
  '/wholesale/market(.*)',
  '/wholesale/dashboard(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|gif|png|svg|ico|webp|woff2?|ttf|otf)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
