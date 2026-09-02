import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { PATHNAME_HEADER } from '@/lib/i18n'

/** Routes that require a signed-in user. This is authentication only —
 * authorization is checked against the database inside the matching layout:
 * /admin against `users.role`, /wholesale/dashboard against an approved
 * `wholesaler_applications` row, and /wholesale/market against the buyer role.
 * `/wholesale` itself stays open: it is the join page. Its listings are inert —
 * nothing links to a product, and ordering needs a membership — while the trade
 * price and minimum order are public on purpose, so a shopkeeper can judge the
 * market before committing to a side. */
const isProtectedRoute = createRouteMatcher([
  '/account(.*)',
  '/admin(.*)',
  '/wholesale/apply(.*)',
  '/wholesale/market(.*)',
  '/wholesale/dashboard(.*)',
  // Its layout gates on approved *or suspended* — a paused shop can still read
  // what the store owes it. Authentication is still required to get that far.
  '/wholesale/payouts(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  // Forward the pathname so server components can read it. `getServerLocale`
  // needs it to know whether a request is inside the wholesale section, which
  // opens in Bangla while the rest of the store opens in English — and there
  // is no other way for a server component to learn its own URL.
  const headers = new Headers(req.headers)
  headers.set(PATHNAME_HEADER, req.nextUrl.pathname)
  return NextResponse.next({ request: { headers } })
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|gif|png|svg|ico|webp|woff2?|ttf|otf)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
