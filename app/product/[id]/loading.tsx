/**
 * Shown the instant a product link is clicked, while the server renders.
 *
 * Without it Next holds the *old* page on screen until the new one is ready,
 * which reads as a frozen tab — the single biggest contributor to the store
 * feeling slow, independent of how long the query actually takes.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-page px-4 py-10 sm:px-6 lg:px-4">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="aspect-square w-full animate-pulse rounded-2xl bg-muted" />
          <div className="flex gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="size-20 animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        </div>

        <div className="space-y-5 pt-2">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-9 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
          <div className="space-y-2 pt-2">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex gap-3 pt-4">
            <div className="h-12 flex-1 animate-pulse rounded-full bg-muted" />
            <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
      </div>
    </div>
  )
}
