/**
 * Placeholder for the seller console's working area, shared by the two loading
 * boundaries that can cover it — the route group's (which catches the dashboard
 * layout's own shop lookup) and the dashboard's (which catches the page).
 *
 * Console-shaped rather than storefront-shaped: /wholesale/dashboard runs with
 * the site header and footer hidden, so the page-header band `PageSkeleton`
 * draws would be a grey slab above a sidebar.
 */
export function SellerConsoleSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-56 animate-pulse rounded bg-muted" />
        <div className="h-4 w-80 animate-pulse rounded bg-muted" />
      </div>

      {/* The stat tiles across the top. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>

      {/* Then the listings. */}
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-lg border border-border p-3"
          >
            <div className="size-12 shrink-0 animate-pulse rounded-md bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/5 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}
