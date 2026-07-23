import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

/** Routes that require a signed-in user. Admin access is additionally
 * role-checked inside the /admin layout against the database. */
const isProtectedRoute = createRouteMatcher(['/account(.*)', '/admin(.*)'])

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
