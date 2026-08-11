/**
 * The stand-in for a storefront page whose server render is still in flight.
 *
 * Without a `loading.tsx` handing something like this back, Next streams the
 * layout and leaves the page slot empty — the header and the footer collapse
 * together and the page looks broken for as long as the queries take. That is
 * most visible on a route that redirects (/wholesale/apply sends an approved
 * shop to its dashboard), where the wait is two page loads back to back.
 *
 * Deliberately route-agnostic: the band mirrors `PageHeader`'s own
 * `border-b bg-muted/60` so the swap to the real header does not move anything,
 * but it carries no title, which would be wrong on half the routes that share
 * a loading boundary.
 */
export function PageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      <div className="border-b border-border bg-muted/60">
        <div className="mx-auto max-w-page px-4 py-10 sm:px-6 sm:py-12 lg:px-4">
          <div className="h-3 w-32 animate-pulse rounded bg-muted-foreground/15" />
          <div className="mt-4 h-9 w-72 animate-pulse rounded bg-muted-foreground/15 sm:h-11" />
          <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded bg-muted-foreground/15" />
        </div>
      </div>

      <div className="mx-auto max-w-page px-4 py-10 sm:px-6 sm:py-12 lg:px-4">
        <div className="grid gap-x-10 gap-y-5 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="grid gap-5 sm:grid-cols-2">
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
                <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
